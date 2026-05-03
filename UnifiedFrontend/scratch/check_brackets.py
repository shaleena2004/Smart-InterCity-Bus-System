
import sys

def check_balance(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    stack = []
    brackets = {'(': ')', '{': '}', '[': ']'}
    lines = content.split('\n')
    
    for i, line in enumerate(lines):
        for j, char in enumerate(line):
            if char in brackets.keys():
                stack.append((char, i+1, j+1))
            elif char in brackets.values():
                if not stack:
                    print(f"Extra closing bracket '{char}' at line {i+1}, col {j+1}")
                    return
                top, li, co = stack.pop()
                if brackets[top] != char:
                    print(f"Mismatched bracket '{char}' at line {i+1}, col {j+1} (expected '{brackets[top]}' for '{top}' at line {li}, col {co})")
                    return
    
    if stack:
        for char, li, co in stack:
            print(f"Unclosed bracket '{char}' at line {li}, col {co}")
    else:
        print("All brackets are balanced.")

if __name__ == "__main__":
    check_balance(sys.argv[1])
