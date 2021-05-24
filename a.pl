openaf_version('t8', '20210102').
openaf_version('t8', '20210103').
openaf_version('t8', '20210104').

openaf_versions(D, L) :- findall(V, openaf_version(D, V), L).

openaf_state(D) :- openaf_versions(D, LD), length(LD, LenLD), LenLD > 1.