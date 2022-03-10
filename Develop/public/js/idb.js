// budget hound(db) looks for new scents (transactions) because hounds track things.... get it?

let db;

const request = indexedDB.open('budget_hound', 1);

// Event will emit if DB version changes
request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// If successful
request.onsuccess = function (event) {
    db = event.target.result;
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function (event) {
    // Log error
    console.log(event.target.errorCode);
};

// saveRecord() will execute if submitting a new transaction without a network connection
function saveRecord(record) {
    const transaction = db.transaction(['new_scent'], 'readwrite');

    // Access store
    const transactionObjectStore = transaction.objectStore('new_scent');

    // Add Record to store
    transactionObjectStore.add(record);
}

function uploadTransaction() {
    const transaction = db.transaction(['new_scent'], 'readwrite');

    const transactionObjectStore = transaction.objectStore('new_scent');

    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    const transaction = db.transaction(['new_scent'], 'readwrite');
                    const transactionObjectStore = transaction.objectStore('new_scent');
                    transactionObjectStore.clear();
                    alert('All saved transaction has been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

window.addEventListener('online', uploadTransaction);