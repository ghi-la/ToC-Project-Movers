from django.http import HttpResponse, JsonResponse
from .pseudo_solution_refactored import run_sat_solver

def hello_world(request):
    return HttpResponse("Hello, world!")

def run_SAT(request):
    # Expect parameters step, floors, roads, items, man
    # step = request.GET.get('step')
    floors = request.GET.get('floors')
    # items = request.GET.get('items')
    man = request.GET.get('man')

    SAT_facts, SAT_result = run_sat_solver(workers=int(man))


    results = SAT_result.split('\n')

    is_satisfiable = results[0].replace('s ', '') == 'SATISFIABLE'
    
    # if is_satisfiable:
    #     values = results[1].replace('v ', '').split(' ')
    #     values = [int(v) for v in values if v != '0']
    # else:
    #     values = []

    return JsonResponse({
        # # "step": step,
        # "floors": floors,
        # # "items": items,
        # "man": man,
        "is_satisfiable": is_satisfiable,
        # "values": values
        "SAT_facts": SAT_facts,
    })
