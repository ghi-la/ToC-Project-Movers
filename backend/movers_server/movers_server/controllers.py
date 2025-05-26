from django.http import HttpResponse, JsonResponse
from .pseudo_solution_refactored import run_sat_solver
from .utils import parse_SAT_facts_by_time, parse_SAT_facts_by_workers
import json
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def hello_world(request):
    return HttpResponse("Hello, world!")

@csrf_exempt
def run_SAT(request):
    man = request.GET.get('man')
    data = json.loads(request.body.decode('utf-8'))
    items_l = data.get('items_list', [])


    # TODO: remove this
    # items_l = [[],['lampada', 'comodino', 'lampada']] 

    SAT_facts, SAT_result, SAT_STEPS = run_sat_solver(workers=int(man), items_l=items_l)
    facts = parse_SAT_facts_by_time(SAT_facts)

    return JsonResponse({
        "is_satisfiable": SAT_result,
        'steps': SAT_STEPS,
        'facts': facts,
        "SAT_facts": SAT_facts,

    })

def run_tests(request):
    test1_facts, test1_res, test1_step = run_sat_solver(workers=3)
    test2_facts, test2_res, test2_step = run_sat_solver(workers=6)



    return JsonResponse({
        'test1': {
            'result': test1_res,
            'steps': test1_step,
            'facts': test1_facts,
        },
    })
