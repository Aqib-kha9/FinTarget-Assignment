How to Run Local PC

1. clone FinTarget-Assignment => git clone "link"
2. install Node Modules       => npm i
3. start node.js server       => node index.js

How to Test 

1. You can use postman or any api testing tools to test backend.
2. Send Request from this url: http://localhost:3000/api/v1/:user_id  // you must replace ":user_id" valid id like "123"
3. send this data into body
   {
  "user_id":"123"
  }
4. Send requests multiple time so you see the limitations


Resources references 

1. Node.js Cluster Documentation : https://nodejs.org/docs/latest/api/cluster.html
2. Node.js File System Module    : https://www.w3schools.com/nodejs/nodejs_filesystem.asp
3. Express-rate-limit            : https://express-rate-limit.mintlify.app/quickstart/usage
4. Use Chat GPT some reference   : https://chatgpt.com/



Explanation of the Code

1. Cluster Setup:
   The Primary process forks two worker processes (replicas) to handle incoming requests. Each worker is essentially a clone that can handle requests independently.

2. Rate Limiting:
   We use the express-rate-limit package to enforce a maximum of 20 tasks per minute per user.
   Additional logic in the route handler enforces 1 task per second processing for each user.

3. Queueing System:
   We use a Map to maintain queues for each user, where each user ID maps to an array of tasks.
   A Set keeps track of which users are currently having their tasks processed to prevent duplicate processing.

4. Task Processing:
   The processUserQueue function processes tasks from each user’s queue at a rate of 1 task per second.
   It recursively calls itself to process the next task after a 1-second delay.

5. Logging:
   Each task completion is logged to a file named task-log.txt.

6. Resilience:
   The Primary process listens for any worker exits (failures) and automatically restarts the worker to maintain service availability.


   
