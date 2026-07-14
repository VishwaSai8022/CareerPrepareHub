/**
 * fix-sourceids.js
 * ---------------------------------------------------------------
 * One-time migration script to:
 *  1. Remove questions whose sourceId > 447 (overflow from batch import)
 *  2. Validate sequential coverage across 358–447
 *  3. Log any gaps or duplicates
 *
 * Run once with:  node --experimental-vm-modules scripts/fix-sourceids.js
 */

import connectDB from '../src/config/db.js';
import CodingQuestion from '../src/models/codingQuestion.model.js';

const SOURCE_ID_MIN = 358;
const SOURCE_ID_MAX = 447;

async function run() {
  try {
    await connectDB();
    console.log('Connected to database.\n');

    // ── 1. Audit current state ──────────────────────────────────────────────
    const allQuestions = await CodingQuestion.find({})
      .select('sourceId title')
      .sort({ sourceId: 1 })
      .lean();

    const totalBefore = allQuestions.length;
    const withSourceId  = allQuestions.filter(q => Number.isFinite(q.sourceId));
    const noSourceId    = allQuestions.filter(q => !Number.isFinite(q.sourceId));
    const overflow      = withSourceId.filter(q => q.sourceId > SOURCE_ID_MAX);
    const underflow     = withSourceId.filter(q => q.sourceId < SOURCE_ID_MIN);

    console.log(`=== Audit (before fix) ===`);
    console.log(`  Total questions     : ${totalBefore}`);
    console.log(`  With sourceId       : ${withSourceId.length}`);
    console.log(`  No sourceId         : ${noSourceId.length}`);
    console.log(`  sourceId < ${SOURCE_ID_MIN}       : ${underflow.length}`);
    console.log(`  sourceId > ${SOURCE_ID_MAX} (overflow): ${overflow.length}`);
    if (overflow.length) {
      console.log(`  Overflow IDs        : ${overflow.map(q => q.sourceId).join(', ')}`);
    }

    // ── 2. Remove overflow questions (sourceId > 447) ───────────────────────
    if (overflow.length > 0) {
      const overflowIds = overflow.map(q => q.sourceId);
      const deleteResult = await CodingQuestion.deleteMany({
        sourceId: { $gt: SOURCE_ID_MAX },
      });
      console.log(`\n✅ Deleted ${deleteResult.deletedCount} overflow questions (sourceId > ${SOURCE_ID_MAX}).`);
      console.log(`   Removed IDs: ${overflowIds.join(', ')}`);
    } else {
      console.log(`\n✅ No overflow questions found. Nothing to delete.`);
    }

    // ── 3. Detect duplicates within range ───────────────────────────────────
    const rangeQuestions = await CodingQuestion.find({
      sourceId: { $gte: SOURCE_ID_MIN, $lte: SOURCE_ID_MAX },
    })
      .select('sourceId title')
      .lean();

    const idCounts = {};
    for (const q of rangeQuestions) {
      idCounts[q.sourceId] = (idCounts[q.sourceId] || 0) + 1;
    }

    const duplicates = Object.entries(idCounts)
      .filter(([, count]) => count > 1)
      .map(([id]) => Number(id));

    if (duplicates.length) {
      console.log(`\n⚠️  Duplicate sourceIds detected: ${duplicates.join(', ')}`);
      // For each duplicate, keep only the most recently created document
      for (const dupId of duplicates) {
        const docs = await CodingQuestion.find({ sourceId: dupId })
          .sort({ createdAt: -1 })
          .lean();
        const [keep, ...remove] = docs;
        const removeIds = remove.map(d => d._id);
        await CodingQuestion.deleteMany({ _id: { $in: removeIds } });
        console.log(`   Kept sourceId ${dupId} (${keep.title}), removed ${removeIds.length} duplicate(s).`);
      }
    } else {
      console.log(`✅ No duplicates found within range ${SOURCE_ID_MIN}–${SOURCE_ID_MAX}.`);
    }

    // ── 4. Gap analysis ─────────────────────────────────────────────────────
    const presentIds = new Set(
      (await CodingQuestion.find({ sourceId: { $gte: SOURCE_ID_MIN, $lte: SOURCE_ID_MAX } })
        .select('sourceId')
        .lean())
        .map(q => q.sourceId),
    );

    const missingIds = [];
    for (let id = SOURCE_ID_MIN; id <= SOURCE_ID_MAX; id++) {
      if (!presentIds.has(id)) missingIds.push(id);
    }

    console.log(`\n=== Gap Analysis (${SOURCE_ID_MIN}–${SOURCE_ID_MAX}) ===`);
    console.log(`  Questions present   : ${presentIds.size}`);
    console.log(`  Expected total      : ${SOURCE_ID_MAX - SOURCE_ID_MIN + 1}`);
    if (missingIds.length) {
      console.log(`  ⚠️  Missing IDs (${missingIds.length}): ${missingIds.slice(0, 30).join(', ')}${missingIds.length > 30 ? '...' : ''}`);
    } else {
      console.log(`  ✅ Full sequential coverage confirmed: ${SOURCE_ID_MIN}–${SOURCE_ID_MAX}.`);
    }

    // ── 5. Summary ──────────────────────────────────────────────────────────
    const totalAfter = await CodingQuestion.countDocuments();
    console.log(`\n=== Final Summary ===`);
    console.log(`  Questions before    : ${totalBefore}`);
    console.log(`  Questions after     : ${totalAfter}`);
    console.log(`  Removed             : ${totalBefore - totalAfter}`);
    console.log(`\nDone. sourceId range is now confined to ${SOURCE_ID_MIN}–${SOURCE_ID_MAX}.`);

    process.exit(0);
  } catch (error) {
    console.error('Fix failed:', error.message);
    process.exit(1);
  }
}

run();
