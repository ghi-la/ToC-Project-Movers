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


## TODO:
step -> max number of actions - start from 0 and keep incrementing until SAT => Fastest Solutin
    Not required, must return
flors -> number of flors (maybe just the lengt of the array of items +1(ground flor))
    Required, may return
roads ->
    Not required
man -> workers
    Required, may return
items -> Array of array of strings (label of the object)
    Required as req.body

Must return also the actions performed by each worker
