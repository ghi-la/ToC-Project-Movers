# Movers SAT Solver - Backend
## A Theory of Computation Project

### Authors:
- Dorigo Daniel
- Elisei Giovanni
- Ghilardini Matteo


## Steps to run:
- Activate the venv 
```
source movers-venv/bin/activate
```

- Start the server
```
cd backend/movers_server
python manage.py runserver
```

- Visit 
```
http://127.0.0.1:8000/
```

## Use Case
In order to run the sat solver use API:
```
GET: http://localhost:8000/runSAT?step=1&floors=2&roads=3&items=4&man=5
```
