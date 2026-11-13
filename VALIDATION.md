# Local validation

2026-11-13. Command: `node --test engine.test.mjs`. Exit: 0

```text
(node:28) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///workspace/scratch/8552e63df24d/portfolio/glyphgrid/engine.ts is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to /workspace/scratch/8552e63df24d/portfolio/glyphgrid/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
✔ four rotations restore board without mutation (2.293606ms)
✔ all 40 levels solve by reversing scramble (8.495017ms)
✔ tile multiset preserved across 100 seeds (4.839581ms)
✔ hints are legal; scoring bounded (0.415721ms)
✔ same local date generates same daily board (1.673104ms)
✔ invalid rotation rejected (3.941395ms)
ℹ tests 6
ℹ suites 0
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 363.379819
```

No live org, mobile device, customer adoption or production load validation is implied.
