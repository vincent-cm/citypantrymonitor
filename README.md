# A Angular code snippet about lazy loading delivery orders.

## Requirements

The API endpoint at `/orders` returns order objects.
The `/orders` page on the frontend should display these objects for
consumption by a customer service representative who will use it
to liaise with customers.

You should provide an implementation of the `/orders` page which,
on load, fetches the data from the backend endpoint and displays it
in an appropriate format.
Not all the data may be required - you should decide which parts
of the data should be displayed.

## Development

```bash
# Setup
yarn install

# Live-reloading development server at localhost:4200 and localhost:4300
yarn start
```

## API

The API is accessible at `http://localhost:4300`.

The orders are accessible under the `/orders` endpoint which takes an
optional `page` parameter, starting at 1.

You are free to modify the backend in any way you see fit.

## Running Tests

```
yarn test
```

This runs tests for the frontend.

You should not write tests for the backend or E2E tests.
