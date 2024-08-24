const cluster = require('node:cluster');
const os = require('node:os').availableParallelism();
const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');



const numCPUs = 2; // Two replica sets

// Queue to manage tasks per user
const userTaskQueues = new Map(); // Map of user_id to task queue (array)
const taskProcessing = new Set(); // Set of user_ids currently being processed

const logFilePath = path.join(__dirname, 'task-log.txt');

// Function to write logs to file

const logToFile =(user_id,message)=>{
    fs.appendFile(logFilePath, `${user_id} - ${message}\n`,  (err)=> {
        if (err) throw err;
        console.log('Saved!');
    });
    
}

// Provided task function modified to log to file
const task= async(user_id)=> {
    const message = `task completed at - ${new Date().toISOString()}`;
    console.log(`${user_id} - ${message}`);
    logToFile(user_id, message);
}

// Function to process tasks from the queue
const processUserQueue=(user_id)=> {
    if (taskProcessing.has(user_id)) return; // Already processing this user's tasks

    taskProcessing.add(user_id);

    const queue = userTaskQueues.get(user_id) || [];

    const processNextTask = async () => {
        if (queue.length === 0) {
            taskProcessing.delete(user_id); // No more tasks for this user
            return;
        }

        const nextTask = queue.shift();
        await task(nextTask.user_id);

        // Set a delay of 1 second to respect the rate limit of 1 task per second per user
        setTimeout(processNextTask, 1000);
    };

    processNextTask();
}

if (cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork(); // Restart the worker
    });

} else {
    const app = express();

    // Rate limiter middleware

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 1 minutes
        max: 20, // Limit each IP to 20 requests per `window`.
        handler: (req, res) => {
            return res.status(429).json({ error: "Too many Requests, Please try again later" })
        },
        
    })
    app.use(limiter);


    // Apply the rate limiting middleware to all requests.
    app.use(limiter)





    // Task processing route
    app.post('/api/v1/:user_id', (req, res) => {
        const user_id = req.params.user_id;

        if (!userTaskQueues.has(user_id)) {
            userTaskQueues.set(user_id, []);
        }

        const userQueue = userTaskQueues.get(user_id);

        if (userQueue.length < 20) { // Check the minute limit
            userQueue.push({ user_id });
            processUserQueue(user_id);
            res.status(200).json({ message: 'Task added to queue' });
        } else {
            res.status(429).json({ error: 'Rate limit exceeded for this user' });
        }
    });

    app.get("/", (req, res) => {
        res.json({ message: "This is home route" });
    })

    app.listen(3000, () => {
        console.log(`Worker ${process.pid} started on port 3000`);
    });
}
