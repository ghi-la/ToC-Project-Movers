# ToC-Project-Movers

> In order to run the pseudo-solution must run:
> `python3 ./pseudo_solution.py 6` where the parameter that in this example 6, is the time availlable to "test"

Instead of having `if __name__ == '__main__':` will have a function callable from controller with parameters:

- People (current _vans_)
- Floor (current _cityes_)
- Stairs (current _roads_); understand how to handle it
- Objects (current _parcels_); `objectFloor` will be a dictionary with `{label: floor, ...}`
- Ground floor (current _strartCity_ and _destinationCity_)

`moversToLogisticReduction` may take the inputs from the frontend, sanitize them, and use it to call the `logisticSATSolver` given in class.
`logisticToMoversResults` must take the results given from the `logisticSATSolver`

### Running the frontend

> enter the `frontend` folder
> `npm i` or `npm install` > `npm start` to run on first available port
