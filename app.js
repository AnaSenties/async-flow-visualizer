// ============================================================
// CONFIGURATION
// ============================================================

/**
 * Base URL of the public API used in the demo.
 *
 * We use JSONPlaceholder because:
 * - It's free and doesn't require an API key.
 * - It has realistic endpoints (/users, /posts, /comments, /albums).
 * - It's been available since 2013 (reliable for demos).
 *
 * In production, this would come from an environment variable.
 */
const API_URL = 'https://jsonplaceholder.typicode.com';

/**
 * Reference to the visual log container.
 *
 * It's fetched only once when the script loads (not on every log)
 * to avoid repeated DOM lookups.
 */
const logContainer = document.getElementById('log');


// ============================================================
// LOG UTILITIES
// ============================================================

/**
 * Adds an entry to the visual log with a timestamp and color based on type.
 *
 * @param {string} message - The message to display in the log.
 * @param {string} [type='info'] - The log type: 'info', 'pending', 'success', 'error'.
 *                                 Determines the entry's color (via CSS class).
 * @returns {void}
 */
function addLog(message, type = 'info') {

    // Remove the initial placeholder ("Events will appear here...")
    // only the first time addLog is called. If it doesn't exist,
    // querySelector returns null and the if statement ignores it.
    const placeholder = logContainer.querySelector('.log-placeholder');
    if (placeholder) placeholder.remove();

    // Create a new div for this log entry.
    // It's not in the DOM yet; we append it at the end with appendChild.
    const logElement = document.createElement('div');

    // Assign two CSS classes:
    // - 'log-entry': base styles (padding, margin, left border).
    // - `log-${type}`: color based on type ('info', 'success', etc.).
    // We use a template literal to interpolate the type dynamically.
    logElement.className = `log-entry log-${type}`;

    // Generate a timestamp with millisecond precision.
    // We use 'en-US' for local format and hour12:false for 24h format.
    // Milliseconds are key to seeing the real execution order
    // when events happen in less than 1 second.
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
    });

    // Assign the text with the format: [HH:MM:SS.mmm] message.
    // We use textContent (not innerHTML) to prevent XSS if the message
    // contains HTML characters. The messages are safe, but it's
    // a good practice by default.
    logElement.textContent = `[${timestamp}] ${message}`;

    // Append the entry to the log container.
    logContainer.appendChild(logElement);

    // Auto-scroll to the bottom so the user always sees
    // the latest entry, even if the log is long.
    logContainer.scrollTop = logContainer.scrollHeight;
}


/**
 * Clears the visual log and restores the initial placeholder.
 *
 * It's called at the start of each demo to prevent logs
 * from previous runs mixing with new ones.
 *
 * @returns {void}
 */
function clearLog() {

    // We use innerHTML here (not textContent) because we want
    // to insert real HTML (the <p> tag with its class).
    // We control this HTML (it doesn't come from the user),
    // so there's no XSS risk.
    logContainer.innerHTML = '<p class="log-placeholder">Events will appear here...</p>';
}

// ============================================================
// SECTION 1: CALLBACKS
// ============================================================

/**
 * Fetches a post from the backend using the error-first callback pattern.
 *
 * This function demonstrates how async was handled before promises.
 * A callback with the signature (error, data) is used to handle success and error.
 *
 * @param {number} id - The ID of the post to fetch.
 * @param {Function} callback - Callback function with signature (error, data).
 *                              If error, receives (Error, null).
 *                              If success, receives (null, data).
 * @returns {void} Returns nothing; the result is passed to the callback.
 */
function getPostCallback(id, callback) {

    // Log the start of the request for the demo's visual log.
    // We use 'info' to distinguish it from success/error logs.
    addLog(`📡 Sending request to backend... (ID: ${id})`, 'info');

    // We use fetch instead of XMLHttpRequest because it's the modern API.
    // Even though the topic is callbacks, fetch is cleaner and more readable.
    fetch(`${API_URL}/posts/${id}`)
        .then(response => {

            // fetch does NOT reject the promise on HTTP errors (404, 500).
            // That's why we check response.ok manually and throw an error.
            // This error will be caught by the .catch() below.
            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
            }

            // response.json() returns a promise that resolves with the parsed body.
            // We return that promise so the next .then() receives it.
            return response.json();
        })
        .then(data => {

            // Success: call the callback with (null, data).
            // The first argument null indicates there was NO error.
            // This is the error-first pattern from Node.js.
            callback(null, data);
        })
        .catch(error => {

            // Error: call the callback with (error, null).
            // The second argument null indicates there is NO data.
            // Catches network, HTTP, and parsing errors.
            callback(error, null);
        });
}

/**
 * ─────────────────────────────────────────────────────────────
 * EVENT LISTENER: "Callback Simple" Button
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * Demonstrates the use of an error-first callback with a single request.
 * The callback runs when fetch finishes (success or error).
 *
 * The addLog('⏳ Code execution continues...') runs BEFORE
 * the getPostCallback() callback. This proves that fetch is
 * asynchronous and does NOT block the main thread (Event Loop).
 *
 * Execution order in the log:
 *   1. 🟡 Starting request with callback...
 *   2. 📡 Sending request to backend... (ID: 1)
 *   3. ⏳ Code execution continues asynchronously (Non-blocking)  ← Synchronous
 *   4. 🟢 Callback executed successfully                          ← Asynchronous
 *   5. 📦 Title: "..."
 *   6. 📦 ID: 1
 */
document.getElementById('btnCallbackSimple').addEventListener('click', () => {

    // Clear the log from previous runs.
    // Without this, logs would accumulate and be hard to read.
    clearLog();

    // Log the start of the flow with type 'pending' (yellow color).
    // We use 'pending' to indicate the operation is in progress.
    addLog('🟡 Starting request with callback...', 'pending');

    // Call getPostCallback with id=1 and an error-first callback.
    //
    // The callback receives (error, data):
    // - If error: (Error, null)
    // - If success: (null, data)
    //
    // This callback does NOT run immediately. It runs when
    // fetch finishes, which is a future and uncertain moment.
    getPostCallback(1, (error, data) => {

        // Early return: if there's an error, log it and exit.
        // The 'return' prevents the success addLogs from running.
        if (error) {
            addLog(`🔴 Error: ${error.message}`, 'error');
            return;
        }

        // If no error, display the post data.
        // We use template literals to interpolate properties.
        addLog(`🟢 Callback executed successfully`, 'success');
        addLog(`📦 Title: "${data.title}"`, 'success');
        addLog(`📦 ID: ${data.id}`, 'success');
    });

    // This addLog runs BEFORE the callback above.
    //
    // Why? Because fetch is asynchronous. The callback is queued in
    // the Microtask Queue or Task Queue (depending on the case) and runs
    // when the Call Stack is empty. Meanwhile, synchronous code
    // (this addLog) keeps running.
    //
    // This demonstrates the Event Loop: JavaScript does NOT block the
    // main thread while waiting for the backend response.
    addLog('⏳ Code execution continues asynchronously (Non-blocking)', 'info');
});

// ============================================================
// SECTION 2: NESTED CALLBACK
// ============================================================

/**
 * Fetches a user, their posts, and the comments of the first post.
 *
 * PURPOSE:
 * This function is an example of CALLBACK HELL. Callbacks are nested
 * 3 levels deep, which makes the code:
 * - Hard to read (pyramid to the right).
 * - Hard to maintain (adding a step = nesting more).
 * - Hard to debug (errors fragmented across 3 .catch()).
 *
 * The goal is to show WHY chained promises and async/await
 * are better. In production, you would NEVER write code like this.
 *
 * @param {number} id - The user ID.
 * @param {Function} callback - Error-first callback: (error, data).
 * @returns {void}
 */
function nestedCallback(id, callback) {

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Fetch user
    // ─────────────────────────────────────────────────────────────
    addLog('📡 Step 1: Fetching user...', 'info');

    fetch(`${API_URL}/users/${id}`)
        .then(response => {
            // fetch does NOT reject on HTTP errors (404, 500). We check manually.
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(user => {
            addLog(`✅ User fetched: ${user.name}`, 'success');
            addLog('📡 Step 2: Fetching posts...', 'info');

            // ─────────────────────────────────────────────────────────
            // STEP 2: Fetch user posts (NESTED)
            // ─────────────────────────────────────────────────────────
            // Here begins Callback Hell: a fetch inside another.
            // We don't use 'return' because we don't want to chain; we want to nest.
            fetch(`${API_URL}/posts?userId=${user.id}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(posts => {
                    addLog(`✅ Posts fetched: ${posts.length}`, 'success');
                    addLog('📡 Step 3: Fetching comments...', 'info');

                    // ─────────────────────────────────────────────────
                    // STEP 3: Fetch comments of first post (NESTED)
                    // ─────────────────────────────────────────────────
                    // Third level of nesting. Code grows to the right.
                    fetch(`${API_URL}/posts/${posts[0].id}/comments`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }
                            return response.json();
                        })
                        .then(comments => {
                            addLog(`✅ Comments: ${comments.length}`, 'success');
                            addLog(`✅ Complete flow finished`, 'success');
                            // Success: callback with (null, data) — error-first pattern.
                            callback(null, comments);
                        })
                        .catch(error => {
                            // Third .catch() — fragmented errors.
                            // Each level needs its own error handling.
                            addLog(`🔴 Error in step 3: ${error.message}`, 'error');
                            callback(error, null);
                        });
                })
                .catch(error => {
                    // Second .catch() — more fragmentation.
                    addLog(`🔴 Error in step 2: ${error.message}`, 'error');
                    callback(error, null);
                });
        })
        .catch(error => {
            // First .catch() — this level's error is handled here.
            // If steps 2 or 3 fail, their internal .catch() catch it.
            // This .catch() only catches errors from step 1.
            addLog(`🔴 Error in step 1: ${error.message}`, 'error');
            callback(error, null);
        });
}

/**
 * ─────────────────────────────────────────────────────────────
 * EVENT LISTENER: "Nested Callback" Button
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * Demonstrates the use of nested callbacks (3 levels) to fetch
 * a user, their posts, and the comments of the first post.
 *
 * This is the first step towards Callback Hell. Even with only
 * 3 levels, the problem is already visible: code grows to the
 * right and errors are fragmented across multiple .catch().
 *
 * The addLog('⏳ Code execution continues...') runs BEFORE
 * the nestedCallback() callback. This proves that fetch is
 * asynchronous and does NOT block the main thread.
 *
 * Execution order in the log:
 *  1. 🟡 Starting nested requests...                          ← Synchronous
 *  2. 📡 Step 1: Fetching user...                             ← Synchronous
 *  3. ⏳ Code execution continues asynchronously (Non-blocking) ← Synchronous
 *   ─────────────────────────────────────────────────────
 *   (The Call Stack empties. The Event Loop processes microtasks/tasks)
 *   ─────────────────────────────────────────────────────
 *  4. ✅ User fetched: Leanne Graham                          ← Asynchronous
 *  5. 📡 Step 2: Fetching posts...                            ← Asynchronous
 *  6. ✅ Posts fetched: 10                                    ← Asynchronous
 *  7. 📡 Step 3: Fetching comments...                         ← Asynchronous
 *  8. ✅ Comments: 5                                          ← Asynchronous
 *  9. 🎉 Complete flow finished                               ← Asynchronous (internal log)
 *  10. ✅ Nested flow completed: 5 comments                   ← Asynchronous (new log)
 */
document.getElementById('btnNestedCallback').addEventListener('click', () => {

    // Clear the log from previous runs so each demo is
    // independent and easy to read.
    clearLog();

    // Log the start of the flow with type 'pending' (yellow color).
    addLog('🟡 Starting nested requests...', 'pending');

    // Call nestedCallback with id=1 and an error-first callback.
    //
    // The callback only handles the error case.
    // It doesn't use 'data' because nestedCallback doesn't return a useful value
    // (it only logs progress internally). If we wanted to use the result,
    // we would add a success addLog here.
    nestedCallback(1, (error, data) => {

        // Early return: if there's an error, log it and exit.
        // The 'return' prevents any subsequent code from running.
        if (error) {
            addLog(`🔴 Error: ${error.message}`, 'error');
            return;
        }

        // Confirm the flow finished correctly.
        // 'data' is the comments array returned by the last fetch.
        // Although nestedCallback already logs progress internally, this
        // final log confirms the result from the consumer's perspective.
        addLog(`✅ Nested flow completed: ${data.length} comments`, 'success');
    });

    // This addLog runs BEFORE the callback.
    //
    // Why? Because fetch is asynchronous. The callback is queued
    // in the microtask/task queue and runs when the CallStack
    // is empty. Meanwhile, synchronous code keeps running.
    //
    // This demonstrates the Event Loop: JavaScript does NOT block the
    // main thread while waiting for the backend response.
    addLog('⏳ Code execution continues asynchronously (Non-blocking)', 'info');
});


// ============================================================
// SECTION 3: CALLBACK HELL
// ============================================================
/**
 * EXTREME CALLBACK HELL EXAMPLE (4 LEVELS OF NESTING)
 *
 * PURPOSE:
 * This function demonstrates the worst-case scenario of Callback Hell:
 * 4 nested requests, 4 separate .catch(), and a pyramid that grows
 * to the right. It's the perfect example to show WHY chained
 * promises and async/await are essential.
 *
 * IN PRODUCTION, YOU WOULD NEVER WRITE CODE LIKE THIS.
 *
 * Flow:
 *   1. Fetch user (GET /users/:id)
 *   2. Fetch user posts (GET /posts?userId=:id)
 *   3. Fetch first post comments (GET /posts/:id/comments)
 *   4. Fetch user albums (GET /albums?userId=:id)
 *
 * @param {number} id - The user ID.
 * @param {Function} callback - Error-first callback: (error, data).
 * @returns {void}
 */
function callbackHell(id, callback) {

    // ─────────────────────────────────────────────────────────────
    // LEVEL 1: Fetch user
    // ─────────────────────────────────────────────────────────────
    // Note: there is no start addLog here; it's done in the button.
    fetch(`${API_URL}/users/${id}`)
        .then(response => {
            // fetch does NOT reject on HTTP errors. We check manually.
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(usuario => {
            addLog(`1️⃣ User: ${usuario.name}`, 'success');

            // ─────────────────────────────────────────────────────────
            // LEVEL 2: Fetch user posts (NESTED)
            // ─────────────────────────────────────────────────────────
            // First level of nesting. Code starts growing to the right.
            // We use 'return' here because we want to chain the result,
            // not nest further.
            return fetch(`${API_URL}/posts?userId=${usuario.id}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(posts => {
                    addLog(`2️⃣ Posts: ${posts.length}`, 'success');

                    // ─────────────────────────────────────────────────
                    // LEVEL 3: Fetch first post comments (NESTED)
                    // ─────────────────────────────────────────────────
                    // Second level of nesting. The pyramid grows.
                    return fetch(`${API_URL}/posts/${posts[0].id}/comments`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }
                            return response.json();
                        })
                        .then(comments => {
                            addLog(`3️⃣ Comments: ${comments.length}`, 'success');

                            // ─────────────────────────────────────────
                            // LEVEL 4: Fetch user albums (NESTED)
                            // ─────────────────────────────────────────
                            // Third level of nesting. Here the Callback Hell
                            // problem is already evident.
                            return fetch(`${API_URL}/albums?userId=${usuario.id}`)
                                .then(response => {
                                    if (!response.ok) {
                                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                                    }
                                    return response.json();
                                })
                                .then(albums => {
                                    addLog(`4️⃣ Albums: ${albums.length}`, 'success');
                                    addLog('💀 Callback Hell completed (4 levels)', 'success');

                                    // Success: callback with (null, data).
                                    callback(null, albums);
                                })
                                .catch(error => {
                                    // FOURTH .catch() — fragmented errors.
                                    // Each level needs its own error handling.
                                    addLog(`🔴 Error in step 4: ${error.message}`, 'error');
                                    callback(error, null);
                                });
                        })
                        .catch(error => {
                            // THIRD .catch().
                            addLog(`🔴 Error in step 3: ${error.message}`, 'error');
                            callback(error, null);
                        });
                })
                .catch(error => {
                    // SECOND .catch().
                    addLog(`🔴 Error in step 2: ${error.message}`, 'error');
                    callback(error, null);
                });
        })
        .catch(error => {
            // FIRST .catch() — only catches level 1 errors.
            // Errors from levels 2, 3, and 4 are caught by their
            // own internal .catch(). This is the error fragmentation
            // that makes Callback Hell so hard to maintain.
            addLog(`🔴 Error in step 1: ${error.message}`, 'error');
            callback(error, null);
        });
}

/**
 * ─────────────────────────────────────────────────────────────
 * EVENT LISTENER: "Callback Hell" Button
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * Demonstrates the extreme Callback Hell scenario: 4 nested requests,
 * 4 fragmented .catch(), and a pyramid that grows to the right.
 *
 * The addLog('⏳ Code execution continues...') runs BEFORE
 * the callbackHell() callback. This proves that fetch is
 * asynchronous and does NOT block the main thread (Event Loop).
 *
 *  Execution order in the log:
 *    1. 💀 Starting Callback Hell...                           ← Synchronous (listener)
 *    2. ⏳ Code execution continues asynchronously (Non-blocking) ← Synchronous (listener)
 *       ─────────────────────────────────────────────────────
 *       (The Call Stack empties. The Event Loop processes microtasks/tasks)
 *       ─────────────────────────────────────────────────────
 *    3. 1️⃣ User: Leanne Graham                               ← Asynchronous (fetch 1)
 *    4. 2️⃣ Posts: 10                                          ← Asynchronous (fetch 2)
 *    5. 3️⃣ Comments: 5                                        ← Asynchronous (fetch 3)
 *    6. 4️⃣ Albums: 10                                         ← Asynchronous (fetch 4)
 *    7. 💀 Callback Hell completed (4 levels)                  ← Asynchronous (internal log)
 *    8. ✅ Callback Hell completed: 10 albums                  ← Asynchronous (new success log)
 */
document.getElementById('btnCallbackHell').addEventListener('click', () => {

    // Clear the log from previous runs so each demo is
    // independent and easy to read.
    clearLog();

    // Log the start of the flow with type 'pending' (yellow color).
    addLog('💀 Starting Callback Hell...', 'pending');

    // Call callbackHell with id=1 and an error-first callback.
    //
    // The callback receives (error, data):
    // - If error: (Error, null)
    // - If success: (null, albums)
    callbackHell(1, (error, data) => {

        // Early return: if there's an error, log it and exit.
        // The 'return' prevents any subsequent code from running.
        if (error) {
            addLog(`🔴 Error: ${error.message}`, 'error');
            return;
        }

        // Success: confirm the flow finished correctly.
        // 'data' is the albums array returned by the last fetch.
        // Although callbackHell already logs progress internally,
        // this final log confirms the result from the consumer's
        // perspective (the button's listener).
        addLog(`✅ Callback Hell completed: ${data.length} albums`, 'success');
    });

    // This addLog runs BEFORE the callback.
    //
    // Why? Because fetch is asynchronous. The callback is queued
    // in the microtask/task queue and runs when the CallStack
    // is empty. Meanwhile, synchronous code keeps running.
    //
    // This demonstrates the Event Loop: JavaScript does NOT block the
    // main thread while waiting for backend responses.
    addLog('⏳ Code execution continues asynchronously (Non-blocking)', 'info');
});

/**
 * ─────────────────────────────────────────────────────────────
 * SECTION 4: Promises chained
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * Demonstrates how to chain promises with .then() to avoid
 * Callback Hell. Unlike the nested version, here each
 * .then() returns a promise, and the next .then() waits
 * for it to resolve.
 *
 * Although the code is cleaner than Callback Hell, it still
 * has problems: we lose access to variables from previous
 * steps (that's why we save userId) and error handling
 * is centralized in a single .catch(), which makes it hard to know
 * exactly which step failed.
 *
 * @param {number} id - The user ID.
 * @param {Function} callback - Error-first callback: (error, data).
 * @returns {void}
 */
function promisesChained(id, callback) {
    addLog('🔗 Starting chained requests...', 'pending');

    // Declare userId outside the chain because we need it
    // in step 4. In async/await we wouldn't need this because
    // everything is in the same scope.
    let userId;

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Fetch user
    // ─────────────────────────────────────────────────────────────
    fetch(`${API_URL}/users/${id}`)
        .then(response => {
            // fetch does NOT reject on HTTP errors. We check manually.
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(user => {
            // Save the ID to use it in step 4.
            userId = user.id;
            addLog(`1️⃣ User: ${user.name}`, 'success');

            // RETURN the fetch so the next .then() waits for it to resolve.
            // If we don't return, the flow breaks and the next .then() receives undefined.
            return fetch(`${API_URL}/posts?userId=${user.id}`);
        })

        // ─────────────────────────────────────────────────────────
        // STEP 2: Fetch posts
        // ─────────────────────────────────────────────────────────
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(posts => {
            addLog(`2️⃣ Posts: ${posts.length}`, 'success');

            // Return the comments fetch.
            return fetch(`${API_URL}/posts/${posts[0].id}/comments`);
        })

        // ─────────────────────────────────────────────────────────
        // STEP 3: Fetch comments
        // ─────────────────────────────────────────────────────────
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(comments => {
            addLog(`3️⃣ Comments: ${comments.length}`, 'success');

            // Return the albums fetch using the saved ID.
            return fetch(`${API_URL}/albums?userId=${userId}`);
        })

        // ─────────────────────────────────────────────────────────
        // STEP 4: Fetch albums
        // ─────────────────────────────────────────────────────────
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(albums => {
            addLog(`4️⃣ Albums: ${albums.length}`, 'success');
            addLog(`✅ Complete flow finished`, 'success');

            // Success: callback with (null, data).
            callback(null, albums);
        })

        // ─────────────────────────────────────────────────────────
        // CENTRALIZED ERROR HANDLING
        // ─────────────────────────────────────────────────────────
        .catch(error => {
            // A single .catch() catches errors from the entire chain.
            // This is an advantage over Callback Hell, where each
            // level needed its own .catch().
            //
            // DISADVANTAGE: We don't know exactly which step failed.
            // In production, we would add context to the error or use
            // multiple .catch() to identify the step.
            addLog(`🔴 Error: ${error.message}`, 'error');
            callback(error, null);
        });
}

/**
 * ─────────────────────────────────────────────────────────────
 * EVENT LISTENER: "Promises Chained" Button
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * Runs the chained request flow using .then().
 * Unlike Callback Hell, here the code is linear and
 * errors are handled in a single .catch().
 *
 * Execution order in the log:
 *  1. 🟡 Starting chained requests...                          ← Synchronous (listener)
 *  2. 🔗 Starting chained requests...                          ← Synchronous (inside promisesChained)
 *  3. ⏳ Code execution continues asynchronously (Non-blocking) ← Synchronous (listener)
 *   ─────────────────────────────────────────────────────
 *   (The Call Stack empties. The Event Loop processes microtasks/tasks)
 *   ─────────────────────────────────────────────────────
 *  4. 1️⃣ User: Leanne Graham                                  ← Asynchronous (fetch 1)
 *  5. 2️⃣ Posts: 10                                           ← Asynchronous (fetch 2)
 *  6. 3️⃣ Comments: 5                                         ← Asynchronous (fetch 3)
 *  7. 4️⃣ Albums: 10                                          ← Asynchronous (fetch 4)
 *  8. ✅ Complete flow finished                                ← Asynchronous (internal log)
 *  9. ✅ Chained flow completed: 10 albums                     ← Asynchronous (new success log)
 */
document.getElementById('btnPromisesChained').addEventListener('click', () => {

    // Clear the log from previous runs.
    clearLog();

    // Log the start of the flow.
    addLog('🟡 Starting chained requests...', 'pending');

    // Call the promisesChained function with id=1.
    promisesChained(1, (error, data) => {

        // Early return: if there's an error, log it and exit.
        if (error) {
            addLog(`🔴 Error: ${error.message}`, 'error');
            return;
        }

        // ✅ Success: confirm the flow finished correctly.
        // 'data' is the albums array returned by the last fetch.
        addLog(`✅ Chained flow completed: ${data.length} albums`, 'success');
    });

    // This addLog runs BEFORE the callback.
    // It proves that fetch is asynchronous and does NOT block the main thread.
    addLog('⏳ Code execution continues asynchronously (Non-blocking)', 'info');
});

/**
 * ─────────────────────────────────────────────────────────────
 * SECTION 5: AsyncAwait
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * Demonstrates how to use async/await to consume promises linearly.
 * The code reads top to bottom, as if it were synchronous,
 * but under the hood it's still asynchronous.
 *
 * Unlike promisesChained, here we do NOT need to save
 * userId in an external variable. The entire flow happens in the
 * same scope, so we can access 'user' at any later step.
 *
 * @param {number} id - The user ID.
 * @param {Function} callback - Error-first callback: (error, data).
 * @returns {void}
 */
async function asyncAwait(id, callback) {

    try {
        // ─────────────────────────────────────────────────────────
        // STEP 1: Fetch user
        // ─────────────────────────────────────────────────────────
        // await pauses the function until the fetch resolves.
        // While waiting, the main thread remains free (Event Loop).
        const res1 = await fetch(`${API_URL}/users/${id}`);

        // fetch does NOT reject on HTTP errors. We check manually.
        if (!res1.ok) throw new Error(`HTTP ${res1.status}: ${res1.statusText}`);

        // await waits for the body to parse into JSON.
        const user = await res1.json();
        addLog(`1️⃣ User: ${user.name}`, 'success');

        // ─────────────────────────────────────────────────────────
        // STEP 2: Fetch posts
        // ─────────────────────────────────────────────────────────
        const res2 = await fetch(`${API_URL}/posts?userId=${user.id}`);
        if (!res2.ok) throw new Error(`HTTP ${res2.status}: ${res2.statusText}`);

        const posts = await res2.json();
        addLog(`2️⃣ Posts: ${posts.length}`, 'success');

        // ─────────────────────────────────────────────────────────
        // STEP 3: Fetch comments
        // ─────────────────────────────────────────────────────────
        const res3 = await fetch(`${API_URL}/posts/${posts[0].id}/comments`);
        if (!res3.ok) throw new Error(`HTTP ${res3.status}: ${res3.statusText}`);

        const comments = await res3.json();
        addLog(`3️⃣ Comments: ${comments.length}`, 'success');

        // ─────────────────────────────────────────────────────────
        // STEP 4: Fetch albums
        // ─────────────────────────────────────────────────────────
        // Here we use 'user.id' directly, not an external variable.
        const res4 = await fetch(`${API_URL}/albums?userId=${user.id}`);
        if (!res4.ok) throw new Error(`HTTP ${res4.status}: ${res4.statusText}`);

        const albums = await res4.json();
        addLog(`4️⃣ Albums: ${albums.length}`, 'success');
        addLog(`✅ Complete flow finished`, 'success');

        // Success: callback with (null, data).
        callback(null, albums);

    } catch (error) {
        // A single catch handles errors from any step.
        // Unlike .then().catch(), here we use try/catch.
        addLog(`🔴 Error: ${error.message}`, 'error');
        callback(error, null);
    }
}

/**
 * ─────────────────────────────────────────────────────────────
 * EVENT LISTENER: "Async/Await" Button
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * Runs the request flow using async/await.
 * Unlike Promises Chained, this code is linear
 * (reads top to bottom) and has no nested .then().
 *
 * Execution order in the log:
 *  1. 🟡 Starting async/await requests...                       ← Synchronous (listener)
 *  2. ⏳ Code execution continues asynchronously (Non-blocking) ← Synchronous (listener)
 *   ─────────────────────────────────────────────────────
 *   (The Call Stack empties. The Event Loop processes microtasks/tasks)
 *   ─────────────────────────────────────────────────────
 *  3. 1️⃣ User: Leanne Graham                                  ← Asynchronous (await 1)
 *  4. 2️⃣ Posts: 10                                           ← Asynchronous (await 2)
 *  5. 3️⃣ Comments: 5                                         ← Asynchronous (await 3)
 *  6. 4️⃣ Albums: 10                                          ← Asynchronous (await 4)
 *  7. ✅ Complete flow finished                                ← Asynchronous (internal log)
 *  8. ✅ Async/await flow completed: 10 albums                 ← Asynchronous (new success log)
 */
document.getElementById('btnAsyncAwait').addEventListener('click', () => {

    // Clear the log from previous runs.
    clearLog();

    // Log the start of the flow with type 'pending'.
    addLog('🟡 Starting async/await requests...', 'pending');

    // Call the async function.
    asyncAwait(1, (error, data) => {

        // Early return: if there's an error, log it and exit.
        if (error) {
            addLog(`🔴 Error: ${error.message}`, 'error');
            return;
        }

        // ✅ Success: confirm the flow finished correctly.
        // 'data' is the albums array returned by the last await.
        addLog(`✅ Async/await flow completed: ${data.length} albums`, 'success');
    });

    // This addLog runs BEFORE the callback.
    // It proves that await pauses the function but does NOT block the
    // main thread. The Event Loop keeps processing other tasks.
    addLog('⏳ Code execution continues asynchronously (Non-blocking)', 'info');
});

/**
 * ─────────────────────────────────────────────────────────────
 * SECTION 6: EventLoop
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * Demonstrates the Event Loop execution order in JavaScript.
 *
 * JavaScript is single-threaded, but the Event Loop allows handling
 * asynchronous operations. The execution order is:
 * 1. Call Stack (synchronous code)
 * 2. Microtask Queue (promises, queueMicrotask)
 * 3. Task Queue (setTimeout, events)
 *
 * Microtasks ALWAYS run before Tasks.
 *
 * @returns {void}
 */
function eventLoop() {
    // ─────────────────────────────────────────────────────────────
    // PHASE 1: SYNCHRONOUS CODE (Call Stack)
    // ─────────────────────────────────────────────────────────────
    addLog('🚀 Starting Event Loop...', 'pending');

    // This addLog runs immediately. It's synchronous.
    addLog('1. Synchronous - Start', 'info');

    // ─────────────────────────────────────────────────────────────
    // PHASE 2: SCHEDULE ASYNCHRONOUS TASKS
    // ─────────────────────────────────────────────────────────────

    // 1. Schedule a Task (setTimeout). Goes to the Task Queue.
    // It will run AFTER all Microtasks.
    setTimeout(function() {
        addLog('5. Task - setTimeout(0)', 'success');
    }, 0);

    // 2. Schedule a Microtask (Promise). Goes to the Microtask Queue.
    // It will run BEFORE Tasks.
    Promise.resolve().then(() => {
        addLog('3. Microtask - Promise.then()', 'success');
    });

    // 3. Schedule another Microtask (queueMicrotask). Goes to the Microtask Queue.
    // It will run after the Promise, but BEFORE Tasks.
    queueMicrotask(() => {
        addLog('4. Microtask - queueMicrotask()', 'success');
    });

    // 4. Schedule another Task (setTimeout). Goes to the Task Queue.
    // It will run after the first Task.
    setTimeout(function() {
        addLog('6. Task - setTimeout(0) #2', 'success');
    }, 0);

    // ─────────────────────────────────────────────────────────────
    // PHASE 3: END OF SYNCHRONOUS CODE
    // ─────────────────────────────────────────────────────────────
    // This addLog runs BEFORE any Microtask or Task.
    // It proves that synchronous code has absolute priority.
    addLog('2. Synchronous - End', 'info');
}

/**
 * ─────────────────────────────────────────────────────────────
 * EVENT LISTENER: "Event Loop" Button
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * Runs the Event Loop demo to visualize the execution order:
 * Synchronous → Microtasks → Tasks.
 *
 * This listener proves that JavaScript is single-threaded but
 * non-blocking. Synchronous code runs first, then Microtasks
 * (promises), and finally Tasks (setTimeout).
 *
 *  1. 🚀 Starting Event Loop ...                 ← Synchronous (Call Stack)
 *  2. Synchronous - Start                        ← Synchronous (Call Stack)
 *  3. Synchronous - End                          ← Synchronous (Call Stack)
 *   ─────────────────────────────────────────────────────
 *   (The Call Stack empties. The Event Loop checks queues)
 *   ─────────────────────────────────────────────────────
 *  4. Microtask - Promise.then()                 ← Microtask Queue
 *  5. Microtask - queueMicrotask()               ← Microtask Queue
 *   ─────────────────────────────────────────────────────
 *   (Microtasks empty. The Event Loop checks Tasks)
 *   ─────────────────────────────────────────────────────
 *  6. Task - setTimeout(0)                       ← Task Queue
 *  7. Task - setTimeout(0) #2                    ← Task Queue
 **/
document.getElementById('btnEventLoop').addEventListener('click', () => {

    // Clear the log from previous runs.
    clearLog();

    // Call the eventLoop function that does all the work.
    // It doesn't need a callback because it doesn't make HTTP requests,
    // it only schedules tasks in the Event Loop queues.
    eventLoop();
});

/**
 * ─────────────────────────────────────────────────────────────
 * SECTION 7: PROMISE.ALL
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * Demonstrates how to use Promise.all to make multiple requests
 * in parallel. If all succeed, it returns an array with results.
 * If one fails, the whole flow fails.
 *
 * Promise.all is ideal when requests are independent
 * and you need ALL responses to continue. It's faster
 * than doing them sequentially because they run at the same time.
 *
 * @param {Function} callback - Error-first callback: (error, data).
 * @returns {void}
 */
async function promiseAll(callback) {
    addLog('🚀 Starting Promise.all...', 'pending');
    addLog('📡 Sending 3 requests in parallel...', 'info');

    try {
        // ─────────────────────────────────────────────────────────
        // STEP 1: Make requests in PARALLEL
        // ─────────────────────────────────────────────────────────
        // Promise.all receives an array of promises and runs them
        // all at the same time (not sequentially).
        //
        // We use 'res1', 'res2', 'res3' because each fetch
        // returns a Response object, NOT the JSON data yet.
        const [res1, res2, res3] = await Promise.all([
            fetch(`${API_URL}/posts/1`),
            fetch(`${API_URL}/posts/2`),
            fetch(`${API_URL}/posts/3`)
        ]);

        // ─────────────────────────────────────────────────────────
        // STEP 2: Check HTTP errors
        // ─────────────────────────────────────────────────────────
        // fetch does NOT reject the promise on HTTP errors (404, 500).
        // Promise.all resolves even if some response has an error.
        // That's why we check response.ok manually.
        //
        // If any fails, we throw an error that will be caught
        // by the catch below. If one fails, ALL fail.
        if (!res1.ok) throw new Error(`HTTP ${res1.status}: ${res1.statusText}`);
        if (!res2.ok) throw new Error(`HTTP ${res2.status}: ${res2.statusText}`);
        if (!res3.ok) throw new Error(`HTTP ${res3.status}: ${res3.statusText}`);

        // ─────────────────────────────────────────────────────────
        // STEP 3: Parse JSON of each response
        // ─────────────────────────────────────────────────────────
        // Now that we know all are OK, we parse the body.
        // We use another Promise.all to parse in parallel.
        // Each response.json() returns a promise.
        const [post1, post2, post3] = await Promise.all([
            res1.json(),
            res2.json(),
            res3.json()
        ]);

        // ─────────────────────────────────────────────────────────
        // STEP 4: Log results
        // ─────────────────────────────────────────────────────────
        // Show the title of each post (truncated to 30 characters
        // to fit in the visual log).
        addLog(`✅ Request 1: "${post1.title.slice(0, 30)}..."`, 'success');
        addLog(`✅ Request 2: "${post2.title.slice(0, 30)}..."`, 'success');
        addLog(`✅ Request 3: "${post3.title.slice(0, 30)}..."`, 'success');
        addLog('🎉 All requests completed', 'success');

        // Success: callback with (null, data).
        callback(null, [post1, post2, post3]);

    } catch (error) {
        // A single catch catches errors from ANY request.
        // If one fails, the others are ignored and the flow stops.
        addLog(`🔴 Error: ${error.message}`, 'error');
        callback(error, null);
    }
}

/**
 * ─────────────────────────────────────────────────────────────
 * EVENT LISTENER: "Promise.all" Button
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * Runs the parallel request flow using Promise.all.
 * Shows the result in the visual log.
 *
 * Execution order in the log:
 * 1. 🟡 Starting Promise.all...                               ← Synchronous (listener)
 * 2. 🚀 Starting Promise.all...                              ← Synchronous (inside function)
 * 3. 📡 Sending 3 requests in parallel...                    ← Synchronous (inside function)
 * 4. ⏳ Code execution continues asynchronously (Non-blocking) ← Synchronous (listener)
 * ─────────────────────────────────────────────────────
 * (The Call Stack empties. The Event Loop processes microtasks/tasks)
 * ─────────────────────────────────────────────────────
 * 5. ✅ Request 1: "sunt aut facere..."                     ← Asynchronous (when all 3 arrive)
 * 6. ✅ Request 2: "qui est esse..."                        ← Asynchronous
 * 7. ✅ Request 3: "ea molestias quasi..."                  ← Asynchronous
 * 8. 🎉 All requests completed                              ← Asynchronous
 * 9. ✅ Promise.all completed: 3 posts                       ← Asynchronous (new success log)
 */
document.getElementById('btnPromiseAll').addEventListener('click', () => {

    // Clear the log from previous runs.
    clearLog();

    // Log the start of the flow.
    addLog('🟡 Starting Promise.all...', 'pending');

    // Call the promiseAll function with a callback.
    promiseAll((error, data) => {

        // Early return: if there's an error, log it and exit.
        if (error) {
            addLog(`🔴 Error: ${error.message}`, 'error');
            return;
        }

        // ✅ Success: confirm the flow finished correctly.
        // 'data' is the posts array returned by Promise.all.
        addLog(`✅ Promise.all completed: ${data.length} posts`, 'success');
    });

    // ⚠️ KEY POINT: This addLog runs BEFORE the callback.
    // It proves that fetch is asynchronous and does NOT block the main thread.
    addLog('⏳ Code execution continues asynchronously (Non-blocking)', 'info');
});

/**
 * ─────────────────────────────────────────────────────────────
 * SECTION 8: PROMISE.ALLSETTLED
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * Demonstrates how to use Promise.allSettled to make multiple
 * requests in parallel without one error stopping the entire flow.
 *
 * Unlike Promise.all, this method NEVER rejects. It always
 * returns an array of objects with the form:
 * { status: 'fulfilled', value: ... } or { status: 'rejected', reason: ... }
 *
 * @param {Function} callback - Error-first callback: (error, data).
 * @returns {void}
 */
async function promiseAllSettled(callback) {
    addLog('🚀 Starting Promise.allSettled...', 'pending');
    addLog('📡 Sending 3 requests (one will fail)...', 'info');

    // Promise.allSettled NEVER rejects. It always resolves with an
    // array of status objects, regardless of whether the request failed.
    const results = await Promise.allSettled([
        fetch(`${API_URL}/posts/1`),
        fetch(`${API_URL}/posts/2`),
        fetch(`${API_URL}/posts/99999`) // ← This one will fail with 404
    ]);

    // Iterate over the results array.
    // Here we do NOT use 'result.ok' directly.
    // Why? Because Promise.allSettled doesn't return a 'Response' object,
    // but a status object: { status: 'fulfilled'|'rejected', value|reason }.
    //
    // - If status is 'fulfilled', the actual Response object is inside 'result.value'.
    // - If status is 'rejected', the actual error is inside 'result.reason'.
    results.forEach((result, index) => {

        if (result.status === 'fulfilled') {
            // Here we CAN check .ok because we access the actual
            // Response through 'result.value'.
            if (result.value.ok) {
                addLog(`✅ Request ${index + 1}: OK`, 'success');
            } else {
                addLog(`❌ Request ${index + 1}: HTTP ${result.value.status}`, 'error');
            }
        } else {
            // If status is 'rejected', it's a network error (DNS, timeout, etc.)
            addLog(`❌ Request ${index + 1}: ${result.reason.message}`, 'error');
        }
    });

    addLog('🎉 All requests finished (some failed)', 'success');

    // Return the results array to the listener.
    callback(null, results);
}

/**
 * ─────────────────────────────────────────────────────────────
 * EVENT LISTENER: "Promise.allSettled" Button
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * Runs the parallel request flow using Promise.allSettled.
 * Unlike Promise.all, this method does NOT stop if a request fails.
 *
 * Execution order in the log:
 * 1. 🟡 Starting Promise.allSettled...                        ← Synchronous (listener)
 * 2. 🚀 Starting Promise.allSettled...                        ← Synchronous (function)
 * 3. 📡 Sending 3 requests (one will fail)...                 ← Synchronous (function)
 * 4. ⏳ Code execution continues asynchronously (Non-blocking) ← Synchronous (listener)
 *    ─────────────────────────────────────────────────────────
 *    (The Call Stack empties. The Event Loop processes microtasks/tasks)
 *    ─────────────────────────────────────────────────────────
 * 5. ✅ Request 1: OK                                         ← Asynchronous
 * 6. ✅ Request 2: OK                                         ← Asynchronous
 * 7. ❌ Request 3: HTTP 404                                   ← Asynchronous
 * 8. 🎉 All requests finished (some failed)                   ← Asynchronous
 * 9. ✅ Promise.allSettled completed: 3 results               ← Asynchronous (new log)
 */
document.getElementById('btnPromiseAllSettled').addEventListener('click', () => {

    // Clear the log from previous runs.
    clearLog();

    // Log the start of the flow.
    addLog('🟡 Starting Promise.allSettled...', 'pending');

    // Call the promiseAllSettled function with a callback.
    promiseAllSettled((error, data) => {

        // Early return: if there's an error, log it and exit.
        // (Although Promise.allSettled doesn't reject, something else could fail).
        if (error) {
            addLog(`🔴 Error: ${error.message}`, 'error');
            return;
        }

        // Confirm the flow finished.
        // 'data' is the results array from Promise.allSettled.
        addLog(`✅ Promise.allSettled completed: ${data.length} results`, 'success');
    });

    // This addLog runs BEFORE the callback above.
    // It proves that fetch is asynchronous and does NOT block the main thread.
    addLog('⏳ Code execution continues asynchronously (Non-blocking)', 'info');
});

/**
 * ─────────────────────────────────────────────────────────────
 * SECTION 9: PROMISE.RACE
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * Demonstrates how to use Promise.race to get the result of the
 * first promise that resolves (or rejects). Useful for timeouts
 * or choosing the fastest response from multiple servers.
 *
 * Unlike Promise.all (which returns an array), Promise.race
 * returns A SINGLE value: the one from the first promise to finish.
 * If the first to finish is an error, Promise.race rejects.
 *
 * @param {Function} callback - Error-first callback: (error, data).
 * @returns {void}
 */
async function promiseRace(callback) {
    addLog('🏁 Starting Promise.race...', 'pending');
    addLog('📡 Sending 2 requests (the fastest wins)...', 'info');

    try {
        // Promise.race resolves or rejects with the FIRST promise
        // to finish, regardless of success or error.
        //
        // The result is NOT an array, it's a single Response object.
        const result = await Promise.race([
            fetch(`${API_URL}/posts/1`),
            fetch(`${API_URL}/posts/2`),
        ]);

        // Check if the winning response is OK.
        // (Because fetch does not reject on HTTP errors).
        if (!result.ok) {
            throw new Error(`HTTP ${result.status}: ${result.statusText}`);
        }

        // Parse the JSON of the winning response.
        const response = await result.json();

        // Log the result.
        addLog(`🏆 The fastest was: "${response.title.slice(0, 30)}..."`, 'success');

        // Return the result to the listener.
        callback(null, response);

    } catch (error) {
        // If the first promise to finish was an error (network or HTTP),
        // it falls here.
        addLog(`🔴 Error: ${error.message}`, 'error');
        callback(error, null);
    }
}

/**
 * ─────────────────────────────────────────────────────────────
 * EVENT LISTENER: "Promise.race" Button
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * Runs the parallel request flow using Promise.race.
 * Shows the result of the first request to finish.
 *
 * Execution order in the log:
 * 1. 🟡 Starting Promise.race...                              ← Synchronous (listener)
 * 2. 🏁 Starting Promise.race...                              ← Synchronous (function)
 * 3. 📡 Sending 2 requests (the fastest wins)...             ← Synchronous (function)
 * 4. ⏳ Code execution continues asynchronously (Non-blocking) ← Synchronous (listener)
 *    ─────────────────────────────────────────────────────────
 *    (The Call Stack empties. The Event Loop processes microtasks/tasks)
 *    ─────────────────────────────────────────────────────────
 * 5. 🏆 The fastest was: "sunt aut facere..."                ← Asynchronous (the first to arrive)
 * 6. ✅ Promise.race completed: 1 winner                      ← Asynchronous (new log)
 */
document.getElementById('btnPromiseRace').addEventListener('click', () => {

    // Clear the log from previous runs.
    clearLog();

    // Log the start of the flow.
    addLog('🟡 Starting Promise.race...', 'pending');

    // Call the promiseRace function with a callback.
    promiseRace((error, data) => {

        // Early return: if there's an error, log it and exit.
        if (error) {
            addLog(`🔴 Error: ${error.message}`, 'error');
            return;
        }

        // Confirm the flow finished.
        // 'data' is the Response object of the winning request.
        addLog(`✅ Promise.race completed: 1 winner`, 'success');
    });

    // This addLog runs BEFORE the callback above.
    // It proves that fetch is asynchronous and does NOT block the main thread.
    addLog('⏳ Code execution continues asynchronously (Non-blocking)', 'info');
});

/**
 * ─────────────────────────────────────────────────────────────
 *  SECTION 10: ABORTCONTROLLERDEMO
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE:
 * Demonstrates how to cancel a fetch request using AbortController.
 * If the request takes more than 1 second, it's automatically cancelled.
 *
 * Promises CANNOT be cancelled natively. But fetch accepts
 * a signal from an AbortController. When you call abort(),
 * the promise rejects with an error of type 'AbortError'.
 *
 * @param {Function} callback - Error-first callback: (error, data).
 * @returns {void}
 */
async function abortControllerDemo(callback) {
    addLog('🛑 Starting AbortController demo...', 'pending');
    addLog('📡 Sending request with a 1-second timeout...', 'info');

    // 1. Create the controller that will allow us to cancel the request.
    const controller = new AbortController();

    // 2. Set up a timer. If 1 second (1000ms) passes,
    // controller.abort() is called and the request is cancelled.
    const timeoutId = setTimeout(() => {
        controller.abort();
        addLog('⏰ Timeout reached: cancelling request...', 'error');
    }, 1000);

    try {
        // 3. Pass the signal to fetch so it's "listening"
        // for the controller to cancel it.
        const response = await fetch(`${API_URL}/posts/1`, {
            signal: controller.signal
        });

        // 4. If the request finishes before the timeout, clear the timer
        // so the abort() doesn't run.
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        addLog(`✅ Request completed on time: "${data.title.slice(0, 30)}..."`, 'success');

        callback(null, data);

    } catch (error) {
        // 5. If the request was cancelled, the error will have the name 'AbortError'.
        if (error.name === 'AbortError') {
            addLog('🛑 Request cancelled by the user (AbortError)', 'error');
        } else {
            addLog(`🔴 Error: ${error.message}`, 'error');
        }

        callback(error, null);
    }
}

/**
 * ─────────────────────────────────────────────────────────────
 * EVENT LISTENER: "AbortController" Button
 * ─────────────────────────────────────────────────────────────
 *
 * Execution order in the log:
 * 1. 🟡 Starting AbortController demo...                      ← Synchronous (listener)
 * 2. 🛑 Starting AbortController demo...                      ← Synchronous (function)
 * 3. 📡 Sending request with timeout...                       ← Synchronous (function)
 * 4. ⏳ Code execution continues asynchronously (Non-blocking) ← Synchronous (listener)
 *    ─────────────────────────────────────────────────────────
 *    (The Call Stack empties. The Event Loop processes queues)
 *    ─────────────────────────────────────────────────────────
 * 5. ⏰ Timeout reached: cancelling request...                ← Asynchronous (Task Queue - setTimeout)
 * 6. 🛑 Request cancelled by the user (AbortError)            ← Asynchronous (catch)
 */
document.getElementById('btnAbortController').addEventListener('click', () => {

    clearLog();
    addLog('🟡 Starting AbortController demo...', 'pending');

    abortControllerDemo((error, data) => {
        if (error) {
            // The error was already logged inside the function,
            // so we just exit here.
            return;
        }

        addLog(`✅ AbortController demo completed`, 'success');
    });

    addLog('⏳ Code execution continues asynchronously (Non-blocking)', 'info');
});