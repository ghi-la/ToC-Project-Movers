def parse_SAT_facts_by_workers(SAT_facts):
    workers_facts = {}
    for f in SAT_facts:
        action = f.split('(')[0]

        if action not in ['goesTo', 'pickingUp', 'transports',]:
            continue
        
        # Remove action and parentheses, split by comma
        params = f[len(action) + 1:-1].split(',')
        # Handle actions involving workers
        if action == 'goesTo' and len(params) == 4:
            time, worker, from_floor, to_floor = params
            if worker not in workers_facts:
                workers_facts[worker] = []
            workers_facts[worker].append({
                'action': action,
                'time': int(time),
                'from_floor': from_floor,
                'to_floor': to_floor
            })
        elif action == 'pickingUp' and len(params) == 3:
            time, worker, obj = params
            if worker not in workers_facts:
                workers_facts[worker] = []
            workers_facts[worker].append({
                'action': action,
                'time': int(time),
                'object': obj
            })
        elif action == 'transports' and len(params) == 3:
            time, worker, obj = params
            if worker not in workers_facts:
                workers_facts[worker] = []
            workers_facts[worker].append({
                'action': action,
                'time': int(time),
                'object': obj
            })
        elif action == 'moves' and len(params) == 2:
            time, worker = params
            if worker.startswith('v_'):
                if worker not in workers_facts:
                    workers_facts[worker] = []
                workers_facts[worker].append({
                    'action': action,
                    'time': int(time)
                })
                
    # Sort actions by time for each worker
    for worker in workers_facts:
        workers_facts[worker].sort(key=lambda x: x['time'])

    return workers_facts


def parse_SAT_facts_by_time(SAT_facts):
    time_facts = {}

    for f in SAT_facts:
        action = f.split('(')[0]

        if action not in ['goesTo', 'pickingUp', 'transports']:
            continue

        params = f[len(action) + 1:-1].split(',')

        # Helper to add facts to the dictionary
        def add_fact(time, fact):
            if time not in time_facts:
                time_facts[time] = []
            time_facts[time].append(fact)

        if action == 'goesTo' and len(params) == 4:
            time, worker, from_floor, to_floor = params
            add_fact(time, {
                'action': action,
                'worker': worker,
                'from_floor': from_floor,
                'to_floor': to_floor
            })

        elif action == 'pickingUp' and len(params) == 3:
            time, worker, obj = params
            add_fact(time, {
                'action': action,
                'worker': worker,
                'object': obj
            })

        elif action == 'transports' and len(params) == 3:
            time, worker, obj = params

            # Search for a corresponding goesTo at the same timestamp and worker
            from_floor = None
            to_floor = None
            for fact in time_facts.get(time, []):
                if fact['action'] == 'goesTo' and fact['worker'] == worker:
                    from_floor = fact['from_floor']
                    to_floor = fact['to_floor']
                    break

            fact = {
                'action': action,
                'worker': worker,
                'object': obj
            }
            if from_floor is not None and to_floor is not None:
                fact['from_floor'] = from_floor
                fact['to_floor'] = to_floor

            add_fact(time, fact)

        elif action == 'moves' and len(params) == 2:
            time, worker = params
            if worker.startswith('v_'):
                add_fact(time, {
                    'action': action,
                    'worker': worker
                })

    cleared_time_facts = {}
    for f in time_facts:
        # If there is in the same time a 'goesTo' action and a transport action,
        # we will remove the 'goesTo' action
        if f not in cleared_time_facts:
            cleared_time_facts[f] = []
        for fact in time_facts[f]:
            if fact['action'] == 'goesTo':
                # Check if there is a transport action for the same worker
                if not any(fact2['action'] == 'transports' and fact2['worker'] == fact['worker'] for fact2 in time_facts.get(f, [])):
                    cleared_time_facts[f].append(fact)
            else:
                cleared_time_facts[f].append(fact)
    # Sort the facts by time
    time_facts = {k: sorted(v, key=lambda x: x.get('time', 0)) for k, v in cleared_time_facts.items()}

    return time_facts
