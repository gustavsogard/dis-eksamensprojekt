// To the following dynamic import statement
import('loadtest').then((module) => {
  const loadtest = module.default;

  // Your code using loadtest here

  const options = {
    url: 'http://localhost:3000/api/loadtest',
    maxRequests: 10000,
    concurrency: 50,
    method: 'GET',
    contentType: 'application/json',
    body: JSON.stringify({}),
  };

  function printResult(error, result) {
    if (error) {
      console.error('Error during load test:', error);
    } else {
      console.log('Request per second:', result.rps);
      console.log('Mean latency:', result.meanLatencyMs, 'ms');
      console.log('Total requests sent:', result.totalRequests);
      console.log('Request errors:', result.totalErrors);
      console.log("total time: ", result.totalTimeSeconds)
    }
  }

  loadtest.loadTest(options, printResult);
});
