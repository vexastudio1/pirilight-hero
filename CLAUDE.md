## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Project workflow

Before changing files:

1. Use Graphify first to inspect the project graph and understand the existing structure.
2. Use the UI/UX Pro Max skill when analysing or improving interface design.
3. Search 21st.dev only when an existing component would genuinely improve the result.
4. Use Motion only for purposeful, subtle animations.
5. Preserve the existing PiriLight hero animation unless I explicitly ask to change it.
6. Before major changes, explain your findings and present an implementation plan.
7. Do not replace existing files or restructure the project unnecessarily.