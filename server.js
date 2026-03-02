const fs = require('fs');
const http = require('http');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream');

// ============================================================
// PART 1: Core Modules (Streams)
// ============================================================

// 1. Read file in chunks
// ملاحظة: تأكد من وجود ملف اسمه big.txt في الفولدر
if (fs.existsSync('./big.txt')) {
    const readStream = fs.createReadStream('./big.txt', { encoding: 'utf8' });
    readStream.on('data', (chunk) => {
        console.log('--- New Chunk Received ---');
        console.log(chunk);
    });
}

// 2. Copy content using streams (source.txt to dest.txt)
if (fs.existsSync('./source.txt')) {
    const src = fs.createReadStream('./source.txt');
    const dest = fs.createWriteStream('./dest.txt');
    src.pipe(dest);
}

// 3. Pipeline: Read -> Compress -> Write
if (fs.existsSync('./data.txt')) {
    const gzip = zlib.createGzip();
    const source = fs.createReadStream('./data.txt');
    const output = fs.createWriteStream('./data.txt.gz');
    pipeline(source, gzip, output, (err) => {
        if (err) console.error('Pipeline failed:', err);
        else console.log('Pipeline: File compressed successfully.');
    });
}

// ============================================================
// PART 2: Simple CRUD Operations Using HTTP
// ============================================================

const jsonPath = path.join(__dirname, 'users.json');

// Helper function لقراءة البيانات
const readUsers = () => {
    if (!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, JSON.stringify([]));
    const data = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(data || '[]');
};

// Helper function لكتابة البيانات
const writeUsers = (users) => {
    fs.writeFileSync(jsonPath, JSON.stringify(users, null, 2));
};

const server = http.createServer((req, res) => {
    const { method, url } = req;
    res.setHeader('Content-Type', 'application/json');

    // GET /user (عرض كل المستخدمين)
    if (url === '/user' && method === 'GET') {
        return res.end(JSON.stringify(readUsers()));
    }

    // POST /user (إضافة مستخدم جديد)
    if (url === '/user' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const newUser = JSON.parse(body);
            let users = readUsers();
            
            // التأكد من أن الايميل غير مكرر
            if (users.find(u => u.email === newUser.email)) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ message: "Email already exists." }));
            }

            newUser.id = users.length > 0 ? users[users.length - 1].id + 1 : 1;
            users.push(newUser);
            writeUsers(users);
            res.end(JSON.stringify({ message: "User added successfully." }));
        });
        return;
    }

    // التعامل مع /user/:id (GET, PATCH, DELETE)
    const urlParts = url.split('/');
    if (urlParts[1] === 'user' && urlParts[2]) {
        const id = parseInt(urlParts[2]);
        let users = readUsers();
        const userIndex = users.findIndex(u => u.id === id);

        if (userIndex === -1) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ message: "User ID not found." }));
        }

        if (method === 'GET') {
            return res.end(JSON.stringify(users[userIndex]));
        }

        if (method === 'DELETE') {
            users.splice(userIndex, 1);
            writeUsers(users);
            return res.end(JSON.stringify({ message: "User deleted successfully." }));
        }

        if (method === 'PATCH') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                const updates = JSON.parse(body);
                users[userIndex] = { ...users[userIndex], ...updates };
                writeUsers(users);
                res.end(JSON.stringify({ message: "User age updated successfully." }));
            });
            return;
        }
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ message: "Route not found" }));
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});

// ============================================================
// BONUS: Majority Element (LeetCode)
// ============================================================
function majorityElement(nums) {
    let sol = 0, cnt = 0;
    for (let n of nums) {
        if (cnt === 0) sol = n;
        if (n === sol) cnt++;
        else cnt--;
    }
    return sol;
}

/*
============================================================
PART 3: Node Internals (Theoretical Answers)
============================================================
1. Event Loop: A mechanism that allows Node.js to perform non-blocking I/O operations by offloading tasks to the system kernel.
2. Libuv: A C library that provides support for asynchronous I/O and manages the thread pool and event loop.
3. Asynchronous Handling: Node sends async tasks to Libuv, which executes them and returns the callback to the event queue.
4. Difference: Call Stack (Executes code), Event Queue (Holds callbacks), Event Loop (Moves callbacks to stack).
5. Thread Pool: A set of threads used for heavy tasks (FS, Crypto). Default size is 4.
6. Blocking vs Non-Blocking: Blocking stops execution until the task is done, Non-blocking moves to the next task immediately.
*/