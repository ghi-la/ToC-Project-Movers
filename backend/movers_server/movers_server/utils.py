def parse_SAT_facts(SAT_facts):
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