# Wheels Process Wiki — Agent Instructions

## HARD CONSTRAINTS
1. Always use `%%{init: {'theme':'base',...}}%%` on line 1 of every Mermaid file
2. NO blank line between %%{init}%% and flowchart directive
3. Node IDs MUST start with a letter (never 1.1 or 2.3)
4. Arrows: always --> (never --gt or --&gt;)
5. BPMN ordering fix: add inter-phase connectors after all subgraphs:
   LastNodeP1 --> FirstNodeP2
   LastNodeP2 --> FirstNodeP3
6. processes.json is LOCAL ONLY — never push to GitHub
7. Always fetch SHA before PUT to GitHub Contents API
8. Use Tree API batch push — never push files one by one
9. getSiteRoot() uses depth-counting fallback, not return '/'
