import * as express from 'express';

const app = express();

const orders = require('./data/orders.json');
const len = orders.length;
// Enable CORS
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

app.get('/', (req, res) => {
  res.send('');
});

/**
 * Fetches a list of orders, paginated.
 * Parameters: page (number) the current page, starting at 1.
 */

// modification: I assume it is much more making sense to use page-free pagination at the UI since
// no body care whether the current page is 203 or 204, and total page is 1023 or 1024.
// What user care is a stream of the desired sorting like twitter, or facebook timeline
// The modification is only to mock data without considering the manipulation performance as below
/**
app.get('/orders', (req, res) => {
  const page = req.query.page ? Math.max(1, req.query.page) : 1;

  const items = orders.slice(100 * (page - 1), 100 * page);

  res.send({
    page: page,
    pageSize: 100,
    total: orders.length,
    count: items.length,
    items
  });
});
 */

/**
* response format

 {
  error: 0,
  message: 'OK',
  result: {
    nextPage: false,
    resultSize: 0,
    items: []
  }
}
 */

app.get('/orders', async (req, res, next) => {
  try {
    let error = 0;
    let message = 'OK';
    let nextPage = false;
    let resultSize = 0;

    const page = req.query.page ? Math.max(1, req.query.page) : 1;
    const items = orders.slice(100 * (page - 1), 100 * page);

    nextPage = 100 * page < len ? true : false;
    resultSize = items ? items.length : 0;

    const response = {
      error: error,
      message: nextPage ? message : 'No more data!',
      result: {
        nextPage: nextPage,
        resultSize: resultSize,
        items: items
      }
    };

    if (req.accepts('json')) {
      // send jsonp for cors
      res.json(response);
    } else {
      res.send(response);
    }
  } catch (error) {
    next(error);
  }
});

app.listen(4300, () => console.log('Server active on port 4300!'));
