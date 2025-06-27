import random
import json
import uuid
import os
import re
from collections import defaultdict

def load_json_file(file_path):
    """
    Load a JSON file and return its contents, with special handling for files with leading commas.
    
    Args:
        file_path (str): Path to the JSON file.
        
    Returns:
        dict: The JSON contents.
    """
    try:
        # First try standard JSON loading
        with open(file_path, 'r') as file:
            data = json.loads(file.read())
            return data
    except json.JSONDecodeError:
        print("Standard JSON parsing failed. Attempting to fix the format...")
        
        # Try to fix the format by handling leading commas
        with open(file_path, 'r') as file:
            content = file.read()
        
        # Approach 1: Try replacing the first comma in the items array
        fixed_content = content.replace('"items": [,', '"items": [')
        try:
            data = json.loads(fixed_content)
            print("Fixed JSON successfully using approach 1!")
            return data
        except json.JSONDecodeError:
            print("Approach 1 failed. Trying approach 2...")
        
        # Approach 2: More aggressive cleaning - replace all leading commas in the items array
        lines = content.split('\n')
        cleaned_lines = []
        in_items_array = False
        first_item = True
        
        for line in lines:
            stripped = line.strip()
            
            # Check if we're entering the items array
            if '"items"' in stripped and '[' in stripped:
                in_items_array = True
                cleaned_lines.append(line)
                continue
            
            # Check if we're exiting the items array
            if in_items_array and ']' in stripped and not '{' in stripped:
                in_items_array = False
                first_item = True
                cleaned_lines.append(line)
                continue
            
            # Handle items in the array
            if in_items_array and stripped.startswith(',{'):
                if first_item:
                    # Remove the leading comma for the first item
                    cleaned_lines.append(line.replace(',{', '{', 1))
                    first_item = False
                else:
                    cleaned_lines.append(line)
            else:
                cleaned_lines.append(line)
        
        fixed_content = '\n'.join(cleaned_lines)
        
        try:
            data = json.loads(fixed_content)
            print("Fixed JSON successfully using approach 2!")
            return data
        except json.JSONDecodeError:
            print("Approach 2 failed. Trying approach 3...")
        
        # Approach 3: Most aggressive - manually reconstruct the JSON
        try:
            # Split by commas at the beginning of lines
            items = []
            in_items = False
            current_item = ""
            
            for line in content.split('\n'):
                stripped = line.strip()
                
                if '"items": [' in stripped:
                    in_items = True
                    continue
                elif in_items and stripped.startswith(',{'):
                    if current_item:
                        items.append(current_item)
                    current_item = stripped[1:]  # Remove leading comma
                elif in_items and (stripped.startswith('{') or stripped.startswith('"')):
                    if current_item:
                        items.append(current_item)
                    current_item = stripped
                elif in_items and stripped == ']':
                    if current_item:
                        items.append(current_item)
                    in_items = False
                    break
                elif in_items:
                    current_item += " " + stripped
            
            # Manually construct proper JSON
            reconstructed_json = '{\n  "items": [\n    '
            reconstructed_json += ',\n    '.join(items)
            reconstructed_json += '\n  ]\n}'
            
            data = json.loads(reconstructed_json)
            print("Fixed JSON successfully using approach 3!")
            return data
        except Exception as e:
            print(f"Approach 3 failed with error: {e}")
        
        # Approach 4: Custom parser for this specific format
        try:
            print("Trying custom parser for this specific format...")
            
            # Create a custom parser for the specific format in paste.txt
            items = []
            with open(file_path, 'r') as f:
                lines = f.readlines()
                
                # Skip the first two lines (opening brace and "items": [)
                i = 2
                while i < len(lines):
                    line = lines[i].strip()
                    
                    # Skip comment lines
                    if line.startswith('//'):
                        i += 1
                        continue
                    
                    # If line starts with a comma and opening brace
                    if line.startswith(',{'):
                        # This is the start of an item
                        item_json = line[1:]  # Remove leading comma
                        
                        # Check if the item spans multiple lines
                        while not item_json.endswith('}') and i + 1 < len(lines):
                            i += 1
                            next_line = lines[i].strip()
                            if not next_line.startswith('//'):  # Skip comments
                                item_json += " " + next_line
                        
                        try:
                            item = json.loads(item_json)
                            items.append(item)
                        except json.JSONDecodeError:
                            print(f"Failed to parse item: {item_json}")
                    
                    i += 1
            
            if items:
                print(f"Custom parser found {len(items)} items!")
                return {"items": items}
        except Exception as e:
            print(f"Custom parser failed with error: {e}")
        
        # If all approaches fail, print the first few lines of the file for debugging
        with open(file_path, 'r') as file:
            first_lines = [next(file) for _ in range(10)]
            print("\nFirst 10 lines of the file for debugging:")
            for i, line in enumerate(first_lines):
                print(f"{i+1}: {line.rstrip()}")
        
        return None

def analyze_patterns(items):
    """
    Analyze the patterns in the existing items to detect groups.
    
    Args:
        items (list): List of item dictionaries.
        
    Returns:
        dict: Dictionary of detected patterns and their properties.
    """
    # Group items by their ID prefix
    prefix_groups = defaultdict(list)
    
    for item in items:
        # Extract the prefix from the ID (everything before the last hyphen and number)
        match = re.match(r'(.*)-\d+$', item['id'])
        if match:
            prefix = match.group(1)
            prefix_groups[prefix].append(item)
    
    # For each group, identify the first and last item to determine the range
    patterns = {}
    
    for prefix, group_items in prefix_groups.items():
        # Sort items by their number
        sorted_items = sorted(group_items, key=lambda x: int(re.search(r'-(\d+)$', x['id']).group(1)))
        
        if len(sorted_items) >= 2:
            first_item = sorted_items[0]
            last_item = sorted_items[-1]
            
            # Determine which axis changes
            first_num = int(re.search(r'-(\d+)$', first_item['id']).group(1))
            last_num = int(re.search(r'-(\d+)$', last_item['id']).group(1))
            
            # Extract properties from the first item
            item_type = first_item['type']
            category = first_item['category']
            layer_id = first_item['layerId']
            color = first_item['color']
            rotation = first_item.get('rotation', 0)
            scale = first_item.get('scale', 1)
            elevation_offset = first_item.get('elevationOffset', 0)
            
            # Determine if x or y is changing
            if first_item['x'] != last_item['x'] and first_item['y'] == last_item['y']:
                constant_axis = 'y'
                constant_value = first_item['y']
                start_value = first_item['x']
                end_value = last_item['x']
            elif first_item['y'] != last_item['y'] and first_item['x'] == last_item['x']:
                constant_axis = 'x'
                constant_value = first_item['x']
                start_value = first_item['y']
                end_value = last_item['y']
            else:
                # If both x and y change, or neither change, skip this group
                continue
            
            # Get width and height
            width = first_item['width']
            height = first_item['height']
            
            # Extract name pattern from properties if available
            properties = first_item.get('properties', {})
            name_pattern = None
            if 'name' in properties:
                name = properties['name']
                # Extract the part before the number
                name_match = re.match(r'(.*)\s*-\s*\d+$', name)
                if name_match:
                    name_pattern = name_match.group(1)
            
            # Store the pattern details
            patterns[prefix] = {
                'prefix': prefix,
                'first_num': first_num,
                'last_num': last_num,
                'item_type': item_type,
                'category': category,
                'layer_id': layer_id,
                'constant_axis': constant_axis,
                'constant_value': constant_value,
                'start_value': start_value,
                'end_value': end_value,
                'width': width,
                'height': height,
                'rotation': rotation,
                'scale': scale,
                'color': color,
                'elevation_offset': elevation_offset,
                'name_pattern': name_pattern,
                'properties': properties
            }
    
    return patterns

def generate_missing_items(patterns):
    """
    Generate the missing items based on the detected patterns.
    
    Args:
        patterns (dict): Dictionary of detected patterns.
        
    Returns:
        list: List of generated items.
    """
    all_items = []
    
    for prefix, pattern in patterns.items():
        # Generate all items in the range
        for i in range(pattern['first_num'], pattern['last_num'] + 1):
            # Skip existing items (first and last)
            if i == pattern['first_num'] or i == pattern['last_num']:
                continue
            
            # Calculate position based on the pattern
            if pattern['constant_axis'] == 'y':
                x = pattern['start_value'] + (i - pattern['first_num']) * (pattern['end_value'] - pattern['start_value']) / (pattern['last_num'] - pattern['first_num'])
                y = pattern['constant_value']
            else:
                x = pattern['constant_value']
                y = pattern['start_value'] + (i - pattern['first_num']) * (pattern['end_value'] - pattern['start_value']) / (pattern['last_num'] - pattern['first_num'])
            
            # Round to integers if original values were integers
            x = round(x)
            y = round(y)
            
            # Prepare properties
            properties = {}
            if pattern['name_pattern']:
                properties = {"name": f"{pattern['name_pattern']}-{i}"}
            elif 'properties' in pattern and pattern['properties']:
                properties = pattern['properties'].copy()
            
            # Create the item
            item = {
                "id": f"{prefix}-{i}",
                "type": pattern['item_type'],
                "category": pattern['category'],
                "x": x,
                "y": y,
                "width": pattern['width'],
                "height": pattern['height'],
                "rotation": pattern['rotation'],
                "scale": pattern['scale'],
                "color": pattern['color'],
                "layerId": pattern['layer_id'],
                "elevationOffset": pattern['elevation_offset'],
                "properties": properties
            }
            
            all_items.append(item)
    
    return all_items

def merge_items(original_data, new_items):
    """
    Merge the original data with new items, keeping the structure.
    
    Args:
        original_data (dict): Original JSON data.
        new_items (list): List of new items to add.
        
    Returns:
        dict: Merged data.
    """
    # Make a deep copy of the original data
    merged_data = {key: value for key, value in original_data.items()}
    
    # Extract existing items
    existing_items = merged_data.get('items', [])
    
    # Get existing IDs to avoid duplicates
    existing_ids = set(item.get('id') for item in existing_items)
    
    # Add new items if they don't already exist
    for new_item in new_items:
        if new_item.get('id') not in existing_ids:
            existing_items.append(new_item)
            existing_ids.add(new_item.get('id'))
    
    # Sort items by their ID for better organization
    sorted_items = sorted(existing_items, key=lambda x: (
        x.get('id', '').split('-')[0],  # Sort by prefix
        x.get('id', '').split('-')[1] if len(x.get('id', '').split('-')) > 1 else '',  # Then by section
        int(re.search(r'-(\d+)$', x.get('id', '')).group(1)) if re.search(r'-(\d+)$', x.get('id', '')) else 0  # Then by number
    ))
    
    # Update the items in the merged data
    merged_data['items'] = sorted_items
    
    return merged_data

def format_output_file(data):
    """
    Format the output file with leading commas for each item (no trailing commas).
    
    Args:
        data (dict): The data to format.
        
    Returns:
        str: Formatted string.
    """
    # First convert to pretty JSON
    json_str = json.dumps(data, indent=2)
    
    # Now reformat to match the specific style needed
    formatted_output = "{\n  \"items\": ["
    
    first_item = True
    for item in data["items"]:
        item_json = json.dumps(item, indent=2)
        
        # Format with indentation
        indented_item = "\n    "
        lines = item_json.split("\n")
        indented_item += "\n    ".join(lines)
        
        # Add comma in the right place (before each item except the first)
        if first_item:
            formatted_output += indented_item
            first_item = False
        else:
            formatted_output += f"\n    ,{indented_item[5:]}"  # Skip the initial indentation
    
    formatted_output += "\n  ]\n}"
    
    return formatted_output

def save_file(data, file_path, use_leading_commas=True):
    """
    Save the data to a file.
    
    Args:
        data (dict): The data to save.
        file_path (str): Path to save the file.
        use_leading_commas (bool): Whether to use leading commas for items.
        
    Returns:
        bool: True if successful, False otherwise.
    """
    try:
        if use_leading_commas:
            # Format with leading commas
            formatted_data = format_output_file(data)
            with open(file_path, 'w') as file:
                file.write(formatted_data)
        else:
            # Standard JSON formatting
            with open(file_path, 'w') as file:
                json.dump(data, file, indent=2)
        
        return True
    except Exception as e:
        print(f"Error saving file: {e}")
        return False

def main():
    import sys
    
    print("JSON Layout Analyzer & Gap Filler")
    print("=================================")
    
    # Get input file from command-line arguments or prompt
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    else:
        input_file = input("Enter the path to your JSON file: ")
    
    if not os.path.exists(input_file):
        print(f"File not found: {input_file}")
        return
    
    # Load the JSON data
    data = load_json_file(input_file)
    if not data:
        print("Failed to load JSON data. Please check the file format.")
        return
    
    # Extract items
    items = data.get('items', [])
    if not items:
        print("No items found in the JSON data.")
        return
    
    print(f"Loaded {len(items)} items from the file.")
    
    # Analyze patterns
    patterns = analyze_patterns(items)
    
    if not patterns:
        print("No patterns detected in the existing items.")
        return
    
    print(f"Detected {len(patterns)} patterns:")
    for prefix, pattern in patterns.items():
        print(f"  - {prefix}: Items {pattern['first_num']} to {pattern['last_num']} ({pattern['constant_axis']} = {pattern['constant_value']})")
    
    # Generate missing items
    print("\nGenerating missing items...")
    new_items = generate_missing_items(patterns)
    print(f"Generated {len(new_items)} missing items.")
    
    # Create default output filename
    default_output_file = f"{os.path.splitext(input_file)[0]}_complete.json"
    
    # Determine if we're in non-interactive mode (command-line usage)
    non_interactive = len(sys.argv) > 1
    
    # In non-interactive mode, use defaults without prompting
    if non_interactive:
        # Show a sample of generated items
        sample_size = min(3, len(new_items))
        print("\nSample of generated items:")
        for i in range(sample_size):
            print(json.dumps(new_items[i], indent=2))
        
        # Use default output file and settings
        output_file = default_output_file
        use_commas = True
    else:
        # Interactive mode - ask for user input
        if input("Do you want to see a sample of the generated items? (y/n): ").lower() == 'y':
            sample_size = min(3, len(new_items))
            print("\nSample of generated items:")
            for i in range(sample_size):
                print(json.dumps(new_items[i], indent=2))
        
        # Get output file path
        output_file = input(f"Enter output file path (default: {default_output_file}): ")
        if not output_file:
            output_file = default_output_file
        
        # Ask about leading commas
        use_commas = input("Use leading commas for each item? (y/n, default: y): ").lower() != 'n'
    
    # Merge with original data
    merged_data = merge_items(data, new_items)
    
    # Save the merged data
    if save_file(merged_data, output_file, use_commas):
        print(f"Successfully saved complete data to {output_file}")
        print(f"Added {len(new_items)} items, total items: {len(merged_data['items'])}")
    else:
        print("Failed to save the output file.")

if __name__ == "__main__":
    main()