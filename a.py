import sched, time, threading
s = sched.scheduler(time.time, time.sleep)

def print_time(): 
    print("From print_time", time.time())

def print_some_times():
    print(time.time())
    s.enter(5, 1, print_time, ())
    s.enter(10, 1, print_time, ())
    s.run()
    print(time.time())

x = threading.Thread(target=print_some_times, daemon=True)
x.start()

c = 0
while c < 60:
    time.sleep(1)
    c = c + 1
    print(c)