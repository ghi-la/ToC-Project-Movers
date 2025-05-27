from django.http import HttpResponse, JsonResponse
from .pseudo_solution_refactored import run_sat_solver
from .utils import parse_SAT_facts_by_time, parse_SAT_facts_by_workers
import json
from django.views.decorators.csrf import csrf_exempt
from django.test import RequestFactory

@csrf_exempt
def hello_world(request):
    return HttpResponse("Hello, world!")

@csrf_exempt
def run_SAT(request):
    man = request.GET.get('man')
    data = json.loads(request.body.decode('utf-8'))
    items_l = data.get('items_list', [])

    SAT_facts, SAT_result, SAT_STEPS = run_sat_solver(workers=int(man), items_l=items_l)
    facts = parse_SAT_facts_by_time(SAT_facts)

    return JsonResponse({
        "is_satisfiable": SAT_result,
        'steps': SAT_STEPS-1,
        'facts': facts,
        "SAT_facts": SAT_facts,

    })

def run_tests(request):
    factory = RequestFactory()

    print("-----------------------------------\nRunning test 1:")
    test1_items = [[], ['lamp']]
    test1_workers = 1
    test1_expected_is_satisfiable = 'SATISFIABLE'
    test1_expected_steps = 3
    request_test1 = factory.post(
        '/run_SAT?man='+str(test1_workers),
        data=json.dumps({'items_list': test1_items}),
        content_type='application/json'
    )
    response_test1 = run_SAT(request_test1)
    response_test1_data = json.loads(response_test1.content)
    test1_is_satisfiable = response_test1_data.get('is_satisfiable', 'UNSATISFIABLE')
    test1_steps = response_test1_data.get('steps', 0)

    print("-----------------------------------\nRunning test 2:")
    test2_items = [[], ['lamp', 'table'], ['lamp', 'table']]
    test2_workers = 2
    test2_expected_is_satisfiable = 'SATISFIABLE'
    test2_expected_steps = 8
    request_test2 = factory.post(
        '/run_SAT?man='+str(test2_workers),
        data=json.dumps({'items_list': test2_items}),
        content_type='application/json'
    )

    response_test2 = run_SAT(request_test2)
    response_test2_data = json.loads(response_test2.content)
    test2_is_satisfiable = response_test2_data.get('is_satisfiable', 'UNSATISFIABLE')
    test2_steps = response_test2_data.get('steps', 0)

    print("-----------------------------------\nRunning test 3:")
    test3_items = [[], ['lamp', 'table'], ['lamp', 'table']]
    test3_workers = 1
    test3_expected_is_satisfiable = 'SATISFIABLE'
    test3_expected_steps = 16
    request_test3 = factory.post(
        '/run_SAT?man='+str(test3_workers),
        data=json.dumps({'items_list': test3_items}),
        content_type='application/json'
    )

    response_test3 = run_SAT(request_test3)
    response_test3_data = json.loads(response_test3.content)
    test3_is_satisfiable = response_test3_data.get('is_satisfiable', 'UNSATISFIABLE')
    test3_steps = response_test3_data.get('steps', 0)


    return JsonResponse({
        "test_1": {
            "status_code": response_test1.status_code,
            "passed": test1_is_satisfiable == test1_expected_is_satisfiable and
                        test1_steps == test1_expected_steps,
            "details":
            {
                'workers': test1_workers,
                'items_list': test1_items,
                'expected_is_satisfiable': test1_expected_is_satisfiable,
                'actual_is_satisfiable': test1_is_satisfiable,
                'expected_steps': test1_expected_steps,
                'actual_steps': test1_steps,
            }
        },
        "test_2": {
            "status_code": response_test2.status_code,
            "passed": test2_is_satisfiable == test2_expected_is_satisfiable and
                        test2_steps == test2_expected_steps,
            "details":
            {
                'workers': test2_workers,
                'items_list': test2_items,
                'expected_is_satisfiable': test2_expected_is_satisfiable,
                'actual_is_satisfiable': test2_is_satisfiable,
                'expected_steps': test2_expected_steps,
                'actual_steps': test2_steps,
            }
        },
        "test_3": {
            "status_code": response_test3.status_code,
            "passed": test3_is_satisfiable == test3_expected_is_satisfiable and
                        test3_steps == test3_expected_steps,
            "details":
            {
                'workers': test3_workers,
                'items_list': test3_items,
                'expected_is_satisfiable': test3_expected_is_satisfiable,
                'actual_is_satisfiable': test3_is_satisfiable,
                'expected_steps': test3_expected_steps,
                'actual_steps': test3_steps,
            }
        }
    })
