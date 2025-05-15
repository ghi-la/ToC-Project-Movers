#!/usr/bin/env python3

import sys
import shutil
from subprocess import Popen, PIPE

# SAT solver executable
SATsolver = "z3"

# Globals for var↔name mapping
gVarNumberToName = ["invalid"]
gVarNameToNumber = {}

def closed_range(start, stop, step=1):
    dir = 1 if step > 0 else -1
    return range(start, stop + dir, step)

def varCount():
    return len(gVarNumberToName) - 1

def allVarNumbers():
    return closed_range(1, varCount())

def varNumberToName(num):
    return gVarNumberToName[num]

def varNameToNumber(name):
    return gVarNameToNumber[name]

def addVarName(name):
    gVarNumberToName.append(name)
    gVarNameToNumber[name] = varCount()

def getVarName(**kw):
    p, t = kw['prop'], kw['time']
    if p == 'inFloor':
        o = kw.get('person', kw.get('item'))
        return f"inFloor({t},{o},{kw['floor']})"
    if p in ('canCarry', 'carries'):
        return f"{p}({t},{kw['person']},{kw['item']})"
    if p == 'travels':
        return f"travels({t},{kw['person']},{kw['src']},{kw['dst']})"
    if p == 'moves':
        o = kw.get('person', kw.get('item'))
        return f"moves({t},{o})"

def getVarNumber(**kw):
    return varNameToNumber(getVarName(**kw))

def genVarNames(steps, people, items, floors, connections):
    for t in range(steps + 1):
        for f in floors:
            for p in people:
                addVarName(getVarName(prop='inFloor', time=t, person=p, floor=f))
            for i in items:
                addVarName(getVarName(prop='inFloor', time=t, item=i, floor=f))
        for p in people:
            for i in items:
                addVarName(getVarName(prop='canCarry', time=t, person=p, item=i))
                addVarName(getVarName(prop='carries',  time=t, person=p, item=i))
        for p in people:
            for (f1, f2) in connections:
                addVarName(getVarName(prop='travels', time=t, person=p, src=f1, dst=f2))
            addVarName(getVarName(prop='moves', time=t, person=p))
        for i in items:
            addVarName(getVarName(prop='moves', time=t, item=i))


def genClauses(steps, people, items, floors, connections, init_floors, dest_floor):
    C = []
    # initial: people at top floor
    top = floors[-1]
    for p in people:
        C.append([getVarNumber(prop='inFloor', time=0, person=p, floor=top)])
    # initial: items
    for i in items:
        C.append([getVarNumber(prop='inFloor', time=0, item=i, floor=init_floors[i])])
    # final: items at ground floor
    for i in items:
        C.append([getVarNumber(prop='inFloor', time=steps, item=i, floor=dest_floor)])

    # uniqueness & existence & carry constraints
    for t in range(steps + 1):
        # no one/item in two floors
        for a in floors:
            for b in floors:
                if a >= b: continue
                for p in people:
                    C.append([-getVarNumber(prop='inFloor', time=t, person=p, floor=a),
                              -getVarNumber(prop='inFloor', time=t, person=p, floor=b)])
                for i in items:
                    C.append([-getVarNumber(prop='inFloor', time=t, item=i, floor=a),
                              -getVarNumber(prop='inFloor', time=t, item=i, floor=b)])
        # each somewhere
        for p in people:
            C.append([getVarNumber(prop='inFloor', time=t, person=p, floor=f) for f in floors])
        for i in items:
            C.append([getVarNumber(prop='inFloor', time=t, item=i, floor=f) for f in floors])
        # carry rules
        for p in people:
            for i in items:
                # at most one item per person
                for j in items:
                    if j <= i: continue
                    C.append([-getVarNumber(prop='carries', time=t, person=p, item=i),
                              -getVarNumber(prop='carries', time=t, person=p, item=j)])
                # canCarry iff same floor
                for f in floors:
                    C.append([-getVarNumber(prop='inFloor', time=t, item=i, floor=f),
                              -getVarNumber(prop='inFloor', time=t, person=p, floor=f),
                              getVarNumber(prop='canCarry', time=t, person=p, item=i)])
                    for f2 in floors:
                        if f2 == f: continue
                        C.append([-getVarNumber(prop='inFloor', time=t, item=i, floor=f),
                                  -getVarNumber(prop='inFloor', time=t, person=p, floor=f2),
                                  -getVarNumber(prop='canCarry', time=t, person=p, item=i)])
                C.append([-getVarNumber(prop='carries', time=t, person=p, item=i),
                          getVarNumber(prop='canCarry', time=t, person=p, item=i)])

    # movement/inertia/travels
    for t in range(steps):
        for p in people:
            for f in floors:
                C.append([ getVarNumber(prop='moves', time=t, person=p),
                          -getVarNumber(prop='inFloor', time=t, person=p, floor=f),
                           getVarNumber(prop='inFloor', time=t+1, person=p, floor=f)])
        for i in items:
            for f in floors:
                C.append([ getVarNumber(prop='moves', time=t, item=i),
                          -getVarNumber(prop='inFloor', time=t, item=i, floor=f),
                           getVarNumber(prop='inFloor', time=t+1, item=i, floor=f)])
        for (f1, f2) in connections:
            for p in people:
                C += [
                    [-getVarNumber(prop='travels', time=t, person=p, src=f1, dst=f2),
                     getVarNumber(prop='inFloor', time=t, person=p, floor=f1)],
                    [-getVarNumber(prop='travels', time=t, person=p, src=f1, dst=f2),
                     getVarNumber(prop='inFloor', time=t+1, person=p, floor=f2)]
                ]
                for i in items:
                    C.append([-getVarNumber(prop='travels', time=t, person=p, src=f1, dst=f2),
                              -getVarNumber(prop='carries', time=t, person=p, item=i),
                              getVarNumber(prop='inFloor', time=t+1, item=i, floor=f2)])
                C.append([-getVarNumber(prop='travels', time=t, person=p, src=f1, dst=f2),
                          getVarNumber(prop='moves', time=t, person=p)])
        for p in people:
            C.append([-getVarNumber(prop='moves', time=t, person=p)] +
                     [getVarNumber(prop='travels', time=t, person=p, src=f1, dst=f2)
                      for (f1, f2) in connections])
        for p in people:
            for i in items:
                C.append([-getVarNumber(prop='carries', time=t, person=p, item=i),
                          getVarNumber(prop='moves', time=t, person=p)])
        for i in items:
            C.append([-getVarNumber(prop='moves', time=t, item=i)] +
                     [getVarNumber(prop='carries', time=t, person=p, item=i)
                      for p in people])
    return C

def getDimacsHeader(clauses):
    header = "\n".join(f"c {i} ~ {gVarNumberToName[i]}" for i in allVarNumbers())
    header += f"\np cnf {varCount()} {len(clauses)}"
    return header

def toDimacsCnf(clauses):
    return "\n".join(" ".join(map(str, c)) + " 0" for c in clauses)

def printResult(out):
    print(out.strip())
    if not out.startswith("s SATISFIABLE"): return
    vals = map(int, out.splitlines()[1].split()[1:])
    sol = sorted(varNumberToName(x) for x in vals if x>0)
    print("c SOLUTION:")
    for v in sol: print("c", v)

if __name__ == "__main__":
    if shutil.which(SATsolver) is None:
        print(f"SAT solver '{SATsolver}' not found."); sys.exit(1)
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <steps>"); sys.exit(1)
    steps = int(sys.argv[1])

    # parameters
    people = [f"person_{i}" for i in range(3)]
    items  = [f"item_{i}"  for i in range(3)]
    floors = list(range(5))  # 0=ground ... 4=top
    # bidir adjacencies
    connections = [(i, i+1) for i in floors[:-1]] + [(i+1, i) for i in floors[:-1]]
    init_floors = {"item_0":4, "item_1":2, "item_2":3}
    dest_floor   = 0

    genVarNames(steps, people, items, floors, connections)
    clauses = genClauses(steps, people, items, floors, connections, init_floors, dest_floor)

    with open("tmp.cnf","w") as f:
        f.write(getDimacsHeader(clauses) + "\n" + toDimacsCnf(clauses) + "\n")

    out = Popen([f"{SATsolver} tmp.cnf"], stdout=PIPE, shell=True).communicate()[0].decode()
    printResult(out)
