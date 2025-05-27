# Test Cases - Movers Problem
## Theory of Computation - HW6

Inside our backend is also implemented the route `runTests` that runs 3 different test cases returning the corresponding expected result and also if the test passed or not.

From our tests, we encountered some "performance limitations" from the SAT Solver, so we suggest the following test cases to get an evaluation in reasonable time:

## Test Case 1: 1 worker, 5 items at first floor

- **Frontend JSON:**
```json
{
  "items_list": [["wardrobe", "tv", "bookshelf", "bed", "chair"]]
}
```

- **Backend JSON:**
```json
{
  "items_list": [[], ["wardrobe", "tv", "bookshelf", "bed", "chair"]]
}
```

- **Expected:** 15 steps

---

## Test Case 2: 3 workers, 3 items at first floor, 2 at second

- **Frontend JSON:**
```json
{
  "items_list": [["wardrobe", "tv", "bookshelf"], ["bed", "chair"]]
}
```

- **Backend JSON:**
```json
{
  "items_list": [[], ["wardrobe", "tv", "bookshelf"], ["bed", "chair"]]
}
```

- **Expected:** 8 steps

---

## Test Case 3: 2 workers, 1 item at first floor and third floor

- **Frontend JSON:**
```json
{
  "items_list": [["bed"], [], ["lamp"]]
}
```

- **Backend JSON:**
```json
{
  "items_list": [[], ["bed"], [], ["lamp"]]
}
```

- **Expected:** 7 steps

---

## Test Case 4: 5 workers, 2 items at second floor

- **Frontend JSON:**
```json
{
  "items_list": [[], ["lamp", "mirror"]]
}
```

- **Backend JSON:**
```json
{
  "items_list": [[], [], ["lamp", "mirror"]]
}
```

- **Expected:** 5 steps

---

## Test Case 5: 2 workers, 6 items spread across 3 floors

- **Frontend JSON:**
```json
{
  "items_list": [["box", "rug"], ["mirror", "chair"], ["lamp", "tv"]]
}
```

- **Backend JSON:**
```json
{
  "items_list": [[], ["box", "rug"], ["mirror", "chair"], ["lamp", "tv"]]
}
```

- **Expected:** 15 steps

---

## Test Case 6: 1 worker, 3 items at fourth floor

- **Frontend JSON:**
```json
{
  "items_list": [[], [], [], ["books", "chair", "bag"]]
}
```

- **Backend JSON:**
```json
{
  "items_list": [[], [], [], [], ["books", "chair", "bag"]]
}
```

- **Expected:** 27 steps

---

## Test Case 7: 4 workers, 4 items at second and third floors

- **Frontend JSON:**
```json
{
  "items_list": [[], ["books", "lamp"], ["tv", "shelf"]]
}
```

- **Backend JSON:**
```json
{
  "items_list": [[], [], ["books", "lamp"], ["tv", "shelf"]]
}
```

- **Expected:** 7 steps

---

## Test Case 8: 2 workers, 6 items on first floor

- **Frontend JSON:**
```json
{
  "items_list": [["bed", "lamp", "mirror", "tv", "bookshelf", "rug"]]
}
```

- **Backend JSON:**
```json
{
  "items_list": [[], ["bed", "lamp", "mirror", "tv", "bookshelf", "rug"]]
}
```

- **Expected:** 9 steps

---

## Test Case 9: 3 workers, 1 item per floor up to 4th

- **Frontend JSON:**
```json
{
  "items_list": [["lamp"], ["tv"], ["mirror"], ["painting"]]
}
```

- **Backend JSON:**
```json
{
  "items_list": [[], ["lamp"], ["tv"], ["mirror"], ["painting"]]
}
```

- **Expected:** 9 steps

---

## Test Case 10: 2 workers, 4 items on third floor

- **Frontend JSON:**
```json
{
  "items_list": [[], [], ["chair", "lamp", "books", "tv"]]
}
```

- **Backend JSON:**
```json
{
  "items_list": [[], [], [], ["chair", "lamp", "books", "tv"]]
}
```

- **Expected:** 14 steps
