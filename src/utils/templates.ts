import { FileNode } from '../types';

export function createTemplate(type: string): FileNode[] {
  switch (type) {
    case 'html':
      return [
        {
          name: 'index.html',
          path: 'index.html',
          type: 'file',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Web Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>🌐 Hello World!</h1>
        <p>Welcome to your new web project.</p>
        <button id="btn" onclick="handleClick()">Click Me</button>
        <div id="output"></div>
    </div>
    <script src="script.js"></script>
</body>
</html>`,
          size: 0,
        },
        {
          name: 'style.css',
          path: 'style.css',
          type: 'file',
          content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%);
    color: #e2e8f0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.container {
    text-align: center;
    padding: 40px;
    background: rgba(255,255,255,0.05);
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
    max-width: 500px;
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

p {
    color: #94a3b8;
    margin-bottom: 20px;
}

button {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border: none;
    padding: 12px 32px;
    border-radius: 12px;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
}

#output {
    margin-top: 20px;
    padding: 10px;
    color: #a78bfa;
    font-size: 18px;
}`,
          size: 0,
        },
        {
          name: 'script.js',
          path: 'script.js',
          type: 'file',
          content: `let clickCount = 0;

function handleClick() {
    clickCount++;
    const output = document.getElementById('output');
    output.textContent = 'Clicked ' + clickCount + ' time' + (clickCount > 1 ? 's' : '') + '! 🎉';
    console.log('Button clicked! Count:', clickCount);
}

// Log when page loads
console.log('✨ Page loaded successfully!');
console.log('🚀 Ready to go!');`,
          size: 0,
        },
      ];

    case 'python':
      return [
        {
          name: 'main.py',
          path: 'main.py',
          type: 'file',
          content: `# 🐍 Python Script
# Running with Pyodide in the browser

def greet(name):
    """Generate a greeting message"""
    return f"Hello, {name}! Welcome to CodeArena 🚀"

def fibonacci(n):
    """Generate Fibonacci sequence"""
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

def factorial(n):
    """Calculate factorial recursively"""
    if n <= 1:
        return 1
    return n * factorial(n - 1)

# Main execution
if __name__ == "__main__":
    print(greet("Developer"))
    print()
    
    # Fibonacci sequence
    fib = fibonacci(15)
    print(f"📊 Fibonacci (first 15): {fib}")
    print()
    
    # Factorial
    for i in range(1, 11):
        print(f"  {i}! = {factorial(i)}")
    print()
    
    # List comprehension example
    squares = [x**2 for x in range(1, 11)]
    print(f"🔢 Squares: {squares}")
    
    # Dictionary example
    data = {
        "language": "Python",
        "version": "3.11",
        "environment": "Pyodide (Browser)",
        "status": "Running! ✅"
    }
    print()
    print("📋 Project Info:")
    for key, value in data.items():
        print(f"  {key}: {value}")
    
    print()
    print("✨ Script completed successfully!")`,
          size: 0,
        },
      ];

    case 'javascript':
      return [
        {
          name: 'main.js',
          path: 'main.js',
          type: 'file',
          content: `// 🟨 JavaScript Script
// Running in the browser sandbox

console.log("🚀 JavaScript Script Started!");
console.log("=" .repeat(40));

// Classes
class Calculator {
    constructor() {
        this.history = [];
    }
    
    add(a, b) {
        const result = a + b;
        this.history.push(\`\${a} + \${b} = \${result}\`);
        return result;
    }
    
    multiply(a, b) {
        const result = a * b;
        this.history.push(\`\${a} × \${b} = \${result}\`);
        return result;
    }
    
    getHistory() {
        return this.history;
    }
}

// Using the calculator
const calc = new Calculator();
console.log("📊 Calculator Demo:");
console.log("  5 + 3 =", calc.add(5, 3));
console.log("  7 × 4 =", calc.multiply(7, 4));
console.log("  10 + 20 =", calc.add(10, 20));
console.log("");

// Array methods
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
console.log("🔢 Array Operations:");
console.log("  Numbers:", numbers);
console.log("  Sum:", numbers.reduce((a, b) => a + b, 0));
console.log("  Evens:", numbers.filter(n => n % 2 === 0));
console.log("  Doubled:", numbers.map(n => n * 2));
console.log("");

// Async example
console.log("⏳ Async Demo:");
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    for (let i = 1; i <= 3; i++) {
        await delay(500);
        console.log(\`  Step \${i} completed ✓\`);
    }
    console.log("");
    console.log("✨ All tasks completed!");
})();`,
          size: 0,
        },
      ];

    case 'react':
      return [
        {
          name: 'index.html',
          path: 'index.html',
          type: 'file',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React App</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #0f172a, #1e1b4b);
            color: white;
            min-height: 100vh;
        }
        #root { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect } = React;

        function App() {
            const [count, setCount] = useState(0);
            const [todos, setTodos] = useState([]);
            const [input, setInput] = useState('');

            const addTodo = () => {
                if (input.trim()) {
                    setTodos([...todos, { id: Date.now(), text: input, done: false }]);
                    setInput('');
                }
            };

            const toggleTodo = (id) => {
                setTodos(todos.map(t => t.id === id ? {...t, done: !t.done} : t));
            };

            const deleteTodo = (id) => {
                setTodos(todos.filter(t => t.id !== id));
            };

            const styles = {
                container: {
                    maxWidth: '500px',
                    width: '90%',
                    padding: '40px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                },
                title: {
                    fontSize: '2rem',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '20px',
                    textAlign: 'center',
                },
                counter: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '15px',
                    marginBottom: '30px',
                },
                btn: {
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '16px',
                },
                inputRow: {
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '16px',
                },
                input: {
                    flex: 1,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                },
                todoItem: (done) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    textDecoration: done ? 'line-through' : 'none',
                    opacity: done ? 0.6 : 1,
                }),
                deleteBtn: {
                    background: 'rgba(239,68,68,0.2)',
                    color: '#ef4444',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginLeft: 'auto',
                },
            };

            return (
                <div style={styles.container}>
                    <h1 style={styles.title}>⚛️ React App</h1>
                    
                    <div style={styles.counter}>
                        <button style={styles.btn} onClick={() => setCount(c => c - 1)}>−</button>
                        <span style={{fontSize: '24px', minWidth: '60px', textAlign: 'center'}}>{count}</span>
                        <button style={styles.btn} onClick={() => setCount(c => c + 1)}>+</button>
                    </div>

                    <h3 style={{marginBottom: '12px', fontSize: '16px', color: '#94a3b8'}}>
                        📝 Todo List ({todos.filter(t => !t.done).length} remaining)
                    </h3>
                    
                    <div style={styles.inputRow}>
                        <input
                            style={styles.input}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTodo()}
                            placeholder="Add a new task..."
                        />
                        <button style={styles.btn} onClick={addTodo}>Add</button>
                    </div>

                    <div>
                        {todos.map(todo => (
                            <div key={todo.id} style={styles.todoItem(todo.done)}>
                                <input
                                    type="checkbox"
                                    checked={todo.done}
                                    onChange={() => toggleTodo(todo.id)}
                                />
                                <span>{todo.text}</span>
                                <button style={styles.deleteBtn} onClick={() => deleteTodo(todo.id)}>✕</button>
                            </div>
                        ))}
                        {todos.length === 0 && (
                            <p style={{textAlign: 'center', color: '#475569', padding: '20px'}}>
                                No todos yet. Add one above! 👆
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        ReactDOM.createRoot(document.getElementById('root')).render(<App />);
    </script>
</body>
</html>`,
          size: 0,
        },
      ];

    default:
      return [];
  }
}
