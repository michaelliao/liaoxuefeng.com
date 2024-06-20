let defaultName = 'world';

export function greet(name) {
    let s = name || defaultName;
    console.log(`Hello, ${s}`);
}
