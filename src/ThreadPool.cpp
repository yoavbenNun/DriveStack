#include "ThreadPool.h"

// Constructor: Launches the worker threads
ThreadPool::ThreadPool(size_t threads) : stop(false)
{
    for(size_t i = 0; i < threads; ++i)
    {
        workers.emplace_back(
            [this]
            {
                while(true)
                {
                    std::function<void()> task;

                    {
                        std::unique_lock<std::mutex> lock(this->queue_mutex);
                        
                        // Wait until there is a task to execute or the pool is stopped
                        this->condition.wait(lock, [this]{ 
                            return this->stop || !this->tasks.empty(); 
                        });

                        // If the pool is stopped and the queue is empty, exit the thread
                        if(this->stop && this->tasks.empty())
                            return;

                        // Get the next task from the queue
                        task = std::move(this->tasks.front());
                        this->tasks.pop();
                    }

                    // Execute the task
                    task();
                }
            }
        );
    }
}

// Destructor: Stops the pool and joins all threads
ThreadPool::~ThreadPool()
{
    {
        std::unique_lock<std::mutex> lock(queue_mutex);
        stop = true;
    }
    
    // Wake up all threads so they can check the 'stop' flag and exit
    condition.notify_all();
    
    // Join all threads to ensure they finish before the pool is destroyed
    for(std::thread &worker: workers)
    {
        worker.join();
    }
}