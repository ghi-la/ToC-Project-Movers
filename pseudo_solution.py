#!/usr/bin/env python3

## Default executable of a SAT solver (do not change this)
defSATsolver="z3"

## Change this to an executable SAT solver if z3 is not in your PATH or else
## Example (Linux): SATsolver="/home/user/z3-4.13/bin/z3"
## You can also include command-line options if necessary
SATsolver=defSATsolver

import sys
from subprocess import Popen
from subprocess import PIPE
import re
import random
import os
import shutil

gVarNumberToName = ["invalid"]
gVarNameToNumber = {}

def closed_range(start, stop, step=1):
    dir = 1 if (step > 0) else -1
    return range(start, stop + dir, step)

def varCount():
    global gVarNumberToName
    return len(gVarNumberToName) - 1

def allVarNumbers():
    return closed_range(1, varCount())

def varNumberToName(num):
    global gVarNumberToName
    return gVarNumberToName[num]

def varNameToNumber(name):
    global gVarNameToNumber
    return gVarNameToNumber[name]

def addVarName(name):
    global gVarNumberToName
    global gVarNameToNumber
    gVarNumberToName.append(name)
    gVarNameToNumber[name] = varCount()

# def printClause(clause):
#     print(map(lambda x: "%s%s" % (x < 0 and eval("'-'") or eval ("''"), varNumberToName(abs(x))) , clause))

def getVarNumber(**kwargs):
    return varNameToNumber(getVarName(**kwargs))

def getVarName(**kwargs):
    match kwargs['prop']:
        case 'inTown':
            t = kwargs['time']
            o = kwargs['van'] if 'van' in kwargs else kwargs['parcel']
            c = kwargs['city']
            return "inTown(%d,%s,%s)" % (t, o, c)
        case 'canTransport' | 'transports':
            t = kwargs['time']
            v = kwargs['van']
            p = kwargs['parcel']
            return  kwargs['prop'] + "(%d,%s,%s)" % (t, v, p)
        case 'pickingUp':
            t = kwargs['time']
            v = kwargs['van']
            p = kwargs['parcel']
            return "pickingUp(%d,%s,%s)" % (t, v, p)
        case 'goesTo':
            t = kwargs['time']
            v = kwargs['van']
            c1 = kwargs['city1']
            c2 = kwargs['city2']
            return "goesTo(%d,%s,%s,%s)" % (t, v, c1, c2)
        case 'moves':
            t = kwargs['time']
            o = kwargs['van'] if 'van' in kwargs else kwargs['parcel']
            return "moves(%d,%s)" % (t,o)

def genVarNames(**kwargs):
    steps = kwargs['steps']
    vans = kwargs['vans']
    parcels = kwargs['parcels']
    cities = kwargs['cities']
    roads = kwargs['roads']

    for t in range(0,steps+1):
        for c in cities:
            for v in vans:
                name = getVarName(prop='inTown', van=v, city=c, time=t)
                addVarName(name)

            for p in parcels:
                name = getVarName(prop='inTown', parcel=p, city=c, time=t)
                addVarName(name)

        for v in vans:
            for p in parcels:
                name = getVarName(prop='canTransport', van=v, parcel=p, time=t)
                addVarName(name)

                name = getVarName(prop='transports', van=v, parcel=p, time=t)
                addVarName(name)
                
                # Add new pickingUp variable
                name = getVarName(prop='pickingUp', van=v, parcel=p, time=t)
                addVarName(name)

        for v in vans:
            for (c1,c2) in roads:
                name = getVarName(prop='goesTo', van=v, city1=c1, city2=c2, time=t)
                addVarName(name)

            # This comes handy when writing inertia rules
            name = getVarName(prop='moves', van=v, time=t)
            addVarName(name)

        for p in parcels:
            name = getVarName(prop='moves', parcel=p, time=t)
            addVarName(name)
    pass


def genClauses(**kwargs):
    clauses = []
    
    steps = kwargs['steps']
    vans = kwargs['vans']
    parcels = kwargs['parcels']
    
    # Input map
    cities = kwargs['cities']
    roads = kwargs['roads']
    
    # Input initial/final conditions
    parcel_init_cities = kwargs['parcel_init_cities']
    base_city = kwargs['base_city']
    dest_city = kwargs['dest_city']
    
    # Initial constraints
    for v in vans:
        clauses.append([getVarNumber(prop='inTown', van=v, city=base_city, time=0)])

    for p in parcels:
        clauses.append([getVarNumber(prop='inTown', parcel=p, city=parcel_init_cities[p], time=0)])

    # Final constraints
    for p in parcels:
        clauses.append([getVarNumber(prop='inTown', parcel=p, city=dest_city, time=steps)])

    # Position constraints
    for t in range(0, steps+1):
        
        # No parcel or van can be at the same time in two places
        for idx in range(0,len(cities)):
            for idx2 in range(idx+1, len(cities)):
                c1 = cities[idx]
                c2 = cities[idx2]
                for v in vans:
                    clauses.append([-getVarNumber(prop='inTown', van=v, city=c1, time=t), -getVarNumber(prop='inTown', van=v, city=c2, time=t)])
                    
                for p in parcels:
                    clauses.append([-getVarNumber(prop='inTown', parcel=p, city=c1, time=t), -getVarNumber(prop='inTown', parcel=p, city=c2, time=t)])

        # All vans and parcels need to be somewhere
        for v in vans:
            clauses.append([getVarNumber(prop='inTown', van=v, city=c, time=t) for c in cities])
        for p in parcels:
            clauses.append([getVarNumber(prop='inTown', parcel=p, city=c, time=t) for c in cities])
        
        for v in vans:
            for idx in range(0,len(parcels)):
                p = parcels[idx]
                
                # A van can transport at most one parcel. Can a parcel be transported by at most one van?
                for idx2 in range(idx+1, len(parcels)):
                    p2 = parcels[idx2]
                    # transports(v,p,t) -> -transports(v,p2,t) if p != p2
                    clauses.append([-getVarNumber(prop='transports', van=v, parcel=p, time=t), -getVarNumber(prop='transports', van=v, parcel=p2, time=t)])
                
                # A van can transport a parcel if and only if they are at the same city
                for c in cities:
                    # inTown(p,c,t) & inTown(v,c,t) -> canTransport(v,p,t)
                    clauses.append([-getVarNumber(prop='inTown', parcel=p, city=c, time=t), -getVarNumber(prop='inTown', van=v, city=c, time=t), getVarNumber(prop='canTransport', van=v, parcel=p, time=t)])

                    for c2 in cities:
                        if c2 != c:
                            # inTown(p,c,t) & intown(v,c2,t) -> -canTransport(v,p,t) if c != c2
                            clauses.append([-getVarNumber(prop='inTown', parcel=p, city=c, time=t), -getVarNumber(prop='inTown', van=v, city=c2, time=t), -getVarNumber(prop='canTransport', van=v, parcel=p, time=t)])

                # transports(v,p,t) -> canTransport(v,p,t)
                clauses.append([-getVarNumber(prop='transports', van=v, parcel=p, time=t), getVarNumber(prop='canTransport', van=v, parcel=p, time=t)])
        
    # Movement constraints
    for t in range(0, steps):
        # If a van does not move it stays in the same city
        for v in vans:
            for c in cities:
                # - moves(v,t) & inTown(v,c,t) -> inTown(v,c,t+1)
                clauses.append([getVarNumber(prop='moves', van=v, time=t), -getVarNumber(prop='inTown', van=v, city=c, time=t), getVarNumber(prop='inTown', van=v, city=c, time=t+1)])
        
        # If a parcel does not move it stays in the same city
        for p in parcels:
            for c in cities:
                #-moves(p,t) & inTown(p,c,t) -> inTown(p,c,t+1)
                clauses.append([getVarNumber(prop='moves', parcel=p, time=t), -getVarNumber(prop='inTown', parcel=p, city=c, time=t), getVarNumber(prop='inTown', parcel=p, city=c, time=t+1)])

        # Modeling a van that goes from one city to another
        for (c1,c2) in roads:
            for v in vans:
                # goesTo(v,c1,c2,t) -> inTown(v,c1,t)
                clauses.append([-getVarNumber(prop='goesTo', van=v, city1=c1, city2=c2, time=t), getVarNumber(prop='inTown', van=v, city=c1, time=t)])

                # goesTo(v,c1,c2,t) -> inTown(v,c2,t+1)
                clauses.append([-getVarNumber(prop='goesTo', van=v, city1=c1, city2=c2, time=t), getVarNumber(prop='inTown', van=v, city=c2, time=t+1)])

                # Modeling parcel transport
                for p in parcels:
                    # goesTo(v,c1,c2,t) & transports(v,p,t) -> inTown(p,c2,t+1)
                    clauses.append([-getVarNumber(prop='goesTo', van=v, city1=c1, city2=c2, time=t), -getVarNumber(prop='transports', van=v, parcel=p, time=t), getVarNumber(prop='inTown', parcel=p, city=c2, time=t+1)])

                # Helper to make the encoding lighter: van moves if it goes somewhere
                # goesTo(v,c1,c2,t) -> moves(v,t)
                clauses.append([-getVarNumber(prop='goesTo', van=v, city1=c1, city2=c2, time=t), getVarNumber(prop='moves', van=v, time=t)])

        for v in vans:
            # moves(v,t) -> goesTo(v,c1,c2,t) for some c1,c2 in roads
            clauses.append([-getVarNumber(prop='moves', van=v, time=t)] + [getVarNumber(prop='goesTo', van=v, city1=c1, city2=c2, time=t) for (c1,c2) in roads])

            for p in parcels:
                # transports(v,p,t) -> moves(v,t)
                clauses.append([-getVarNumber(prop='transports', van=v, parcel=p, time=t), getVarNumber(prop='moves', van=v, time=t)])
                
                # NEW CONSTRAINTS FOR PICKUP TIME
                
                # A van can only pick up a parcel if they're in the same city
                for c in cities:
                    # inTown(p,c,t) & inTown(v,c,t) -> pickingUp(v,p,t) is possible
                    # But also, pickingUp(v,p,t) -> inTown(p,c,t) & inTown(v,c,t) for some city c
                    clauses.append([-getVarNumber(prop='pickingUp', van=v, parcel=p, time=t), getVarNumber(prop='canTransport', van=v, parcel=p, time=t)])
                
                # A van that's picking up can't do anything else
                # pickingUp(v,p,t) -> -moves(v,t)
                clauses.append([-getVarNumber(prop='pickingUp', van=v, parcel=p, time=t), -getVarNumber(prop='moves', van=v, time=t)])
                
                # A van can't pick up multiple parcels at the same time
                for p2 in parcels:
                    if p != p2:
                        clauses.append([-getVarNumber(prop='pickingUp', van=v, parcel=p, time=t), -getVarNumber(prop='pickingUp', van=v, parcel=p2, time=t)])
                
                # After picking up, the van is transporting the parcel
                if t < steps:
                    # pickingUp(v,p,t) -> transports(v,p,t+1)
                    clauses.append([-getVarNumber(prop='pickingUp', van=v, parcel=p, time=t), getVarNumber(prop='transports', van=v, parcel=p, time=t+1)])
                    
                    # Parcel and van stay in the same location during pickup
                    for c in cities:
                        # pickingUp(v,p,t) & inTown(v,c,t) -> inTown(v,c,t+1)
                        clauses.append([-getVarNumber(prop='pickingUp', van=v, parcel=p, time=t), -getVarNumber(prop='inTown', van=v, city=c, time=t), getVarNumber(prop='inTown', van=v, city=c, time=t+1)])
                        
                        # pickingUp(v,p,t) & inTown(p,c,t) -> inTown(p,c,t+1)
                        clauses.append([-getVarNumber(prop='pickingUp', van=v, parcel=p, time=t), -getVarNumber(prop='inTown', parcel=p, city=c, time=t), getVarNumber(prop='inTown', parcel=p, city=c, time=t+1)])
                
                # A van can only transport if it picked up the parcel before
                if t > 0:
                    # transports(v,p,t) -> pickingUp(v,p,t-1) or transports(v,p,t-1)
                    clauses.append([-getVarNumber(prop='transports', van=v, parcel=p, time=t), 
                                  getVarNumber(prop='pickingUp', van=v, parcel=p, time=t-1), 
                                  getVarNumber(prop='transports', van=v, parcel=p, time=t-1)])
                else:
                    # At time 0, no van is already transporting a parcel (can't be initialized with a parcel)
                    clauses.append([-getVarNumber(prop='transports', van=v, parcel=p, time=0)])
        
        for p in parcels:
            # moves(p,t) -> transports(v,p,t) for some v
            clauses.append([-getVarNumber(prop='moves', parcel=p, time=t)] + [getVarNumber(prop='transports', van=v, parcel=p, time=t) for v in vans])
    
    return clauses

## A helper function to print the cnf header (do not modify)
def getDimacsHeader(clauses):
    cnt = varCount()
    n = len(clauses)
    str = ""
    for num in allVarNumbers():
        varName = varNumberToName(num)
        str += "c %d ~ %s\n" % (num, varName)
    for cl in clauses:
        print("c ", end='')
        for l in cl:
            print(("!" if (l < 0) else " ") + varNumberToName(abs(l)), "", end='')
        print("")
    print("")
    str += "p cnf %d %d" % (cnt, n)
    return str

## A helper function to print a set of clauses in CNF (do not modify)
def toDimacsCnf(clauses):
    return "\n".join(map(lambda x: "%s 0" % " ".join(map(str, x)), clauses))

## A helper function to print only the satisfied variables in human-readable format (do not modify)
def printResult(res):
    print(res)
    res = res.strip().split('\n')

    # If it was satisfiable, we want to have the assignment printed out
    if res[0] != "s SATISFIABLE":
        return

    # First get the assignment, which is on the second line of the file, and split it on spaces
    # Read the solution
    asgn = map(int, res[1].split()[1:])
    # Then get the variables that are positive, and get their names.
    # This way we know that everything not printed is false.
    # The last element in asgn is the trailing zero and we can ignore it

    # Convert the solution to our names
    facts = map(lambda x: varNumberToName(abs(x)), filter(lambda x: x > 0, asgn))

    # Print the solution
    print("c SOLUTION:")
    for f in sorted(facts):
        print("c", f)

## This function is invoked when the python script is run directly and not imported
if __name__ == '__main__':
    path = shutil.which(SATsolver.split()[0])
    if path is None:
        if SATsolver == defSATsolver:
            print("Set the path to a SAT solver via SATsolver variable on line 9 of this file (%s)" % sys.argv[0])
        else:
            print("Path '%s' does not exist or is not executable." % SATsolver)
        sys.exit(1)

    kwargs = {}
    
    ##+ Start of code insertion
    # Read the arguments
    if len(sys.argv) != 2:
        print("Usage: %s <steps>" % sys.argv[0])
        sys.exit(1)
    steps = int(sys.argv[1])
    if steps < 0:
        print("Usage: <steps> must be a non-negative integer" % sys.argv[0])
        sys.exit(1)
    kwargs['steps'] = steps

    # Hardcoded arguments
    kwargs['vans'] = ["v_%d" % p for p in range(0, 3)]
    kwargs['parcels'] = ["p_%d" % f for f in range(0, 3)]
    
    # Map
    cities = ["Bellinzona", "Morcote", "Agno", "Lugano", "Melide"]
    kwargs['cities'] = cities
    kwargs['roads'] = [
        (cities[0], cities[3]),
        (cities[3], cities[0]),
        (cities[1], cities[3]),
        (cities[3], cities[1]),
        (cities[2], cities[3]),
        (cities[3], cities[2]),
        (cities[1], cities[4]),
        (cities[4], cities[1])]
        
    # Initial conditions
    kwargs['parcel_init_cities'] = {"p_0": cities[0], "p_1": cities[1], "p_2": cities[2]}
    kwargs['base_city'] = cities[0]
    
    # Final condition
    kwargs['dest_city'] = cities[4]
    ##+ End of code insertion

    genVarNames(**kwargs)
    clauses = genClauses(**kwargs)

    head = getDimacsHeader(clauses)
    cnf = toDimacsCnf(clauses)

    # Here we create a temporary cnf file for SATsolver
    fl = open("tmp_prob.cnf", "w")
    fl.write("\n".join([head, cnf]) + "\n")
    fl.close()

    # Run the SATsolver
    solverOutput = Popen([SATsolver + " tmp_prob.cnf"], stdout=PIPE, shell=True).communicate()[0]
    res = solverOutput.decode('utf-8')
    print("--------------------------")
    #printResult(res)
    print("--------------------------")
    print(res.strip())
