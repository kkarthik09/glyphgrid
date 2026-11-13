import test from 'node:test';
import assert from 'node:assert/strict';
import {rotateBlock,generateLevel,boardsEqual,bestHint,starsFor,dailyLevel} from './engine.ts';
test('four rotations restore board without mutation',()=>{const b=[0,1,2,3,4,5,6,7,8];let x=b;for(let i=0;i<4;i++)x=rotateBlock(x,3,0,0,1);assert.deepEqual(x,b);assert.deepEqual(b,[0,1,2,3,4,5,6,7,8]);});
test('all 40 levels solve by reversing scramble',()=>{for(let id=1;id<=40;id++){const l=generateLevel(id);let b=l.start;for(const m of [...l.scramble].reverse())b=rotateBlock(b,l.size,m.row,m.col,-m.dir);assert.ok(boardsEqual(b,l.goal));assert.ok(!boardsEqual(l.start,l.goal));assert.deepEqual(generateLevel(id),l);}});
test('tile multiset preserved across 100 seeds',()=>{for(let s=1;s<=100;s++){const l=generateLevel(32,s);assert.deepEqual([...l.start].sort(),[...l.goal].sort());}});
test('hints are legal; scoring bounded',()=>{const l=generateLevel(20),h=bestHint(l.start,l.goal,l.size);assert.ok(h.row>=0&&h.row<l.size-1&&h.col>=0&&h.col<l.size-1);assert.equal(starsFor(l.par,l,0),3);assert.equal(starsFor(l.par+20,l,10),1);});
test('same local date generates same daily board',()=>assert.deepEqual(dailyLevel(new Date(2026,10,13,1)),dailyLevel(new Date(2026,10,13,23))));
test('invalid rotation rejected',()=>{assert.throws(()=>rotateBlock([1,2,3,4],2,1,0,1),RangeError);assert.throws(()=>rotateBlock([1,2],2,0,0,1),RangeError);});
