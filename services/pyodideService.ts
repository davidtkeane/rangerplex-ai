
// pyodideService.ts

let pyodideInstance: any = null;
let pyodideLoadingPromise: Promise<any> | null = null;

export const initPyodide = async () => {
    if (pyodideInstance) return pyodideInstance;
    if (pyodideLoadingPromise) return pyodideLoadingPromise;

    // @ts-ignore
    if (typeof loadPyodide === 'undefined') {
        throw new Error("Pyodide script not loaded in index.html");
    }

    pyodideLoadingPromise = (async () => {
        console.log("Initializing Pyodide...");
        // @ts-ignore
        const pyodide = await loadPyodide();
        // Load common packages
        await pyodide.loadPackage(['numpy', 'pandas', 'matplotlib']);
        pyodideInstance = pyodide;
        console.log("Pyodide Ready");
        return pyodide;
    })();

    return pyodideLoadingPromise;
};

export const runPythonCode = async (code: string): Promise<string> => {
    const pyodide = await initPyodide();
    
    // Redirect stdout
    pyodide.runPython(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
    `);

    try {
        // Run the user code
        await pyodide.runPythonAsync(code);
        
        // Get stdout
        const stdout = pyodide.runPython("sys.stdout.getvalue()");
        return stdout || "[No Output]";
    } catch (error: any) {
        const stderr = pyodide.runPython("sys.stderr.getvalue()");
        return `Error:\n${error.message}\n${stderr}`;
    }
};
