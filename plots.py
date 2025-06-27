import random
import json
import uuid

def generate_items(layer_id, constant_axis="y", constant_value=39, start_value=10, end_value=571, num_items=52,
                  item_type="plot-standard", category="plot", width_range=(8, 15), height_range=(8, 15),
                  rotation=0, scale=1, color="#d5e8d4", elevation_offset=0, prefix="uuid-plot-h1n"):
    """
    Generate a list of items with specified attributes.
    
    Args:
        layer_id (str): The layer ID for all items.
        constant_axis (str): The axis that remains constant ('x' or 'y').
        constant_value (int): The value for the constant axis.
        start_value (int): The starting value for the variable axis.
        end_value (int): The ending value for the variable axis.
        num_items (int): Number of items to generate.
        item_type (str): Type of item to generate.
        category (str): Category of the item.
        width_range (tuple): Range for random width (min, max).
        height_range (tuple): Range for random height (min, max).
        rotation (int): Rotation value for all items.
        scale (int): Scale value for all items.
        color (str): Color value for all items.
        elevation_offset (int): Elevation offset for all items.
        prefix (str): Prefix for the ID and name.
        
    Returns:
        list: List of generated item dictionaries.
    """
    items = []
    
    # Calculate the step between each item on the variable axis
    step = (end_value - start_value) / (num_items - 1) if num_items > 1 else 0
    
    for i in range(1, num_items + 1):
        # Calculate the position on the variable axis
        variable_value = start_value + (i - 1) * step
        
        # Assign values to x and y based on which axis is constant
        x = variable_value if constant_axis == "y" else constant_value
        y = constant_value if constant_axis == "y" else variable_value
        
        # Generate random width and height within specified ranges
        width = random.uniform(width_range[0], width_range[1])
        height = random.uniform(height_range[0], height_range[1])
        
        # Round to desired precision
        x = round(x)
        y = round(y)
        width = round(width, 1)
        height = round(height, 1)
        
        # Create the name for the item based on the prefix
        prefix_parts = prefix.split('-')
        if len(prefix_parts) >= 3:
            name = f"{prefix_parts[1].capitalize()} {prefix_parts[2].upper()}-{i}"
        else:
            name = f"{prefix}-{i}"
        
        # Properties dictionary - add any specific properties here
        properties = {"name": name} if "plot" in category else {}
        
        # Create the item dictionary
        item = {
            "id": f"{prefix}-{i}",
            "type": item_type,
            "category": category,
            "x": x,
            "y": y,
            "width": width,
            "height": height,
            "rotation": rotation,
            "scale": scale,
            "color": color,
            "layerId": layer_id,
            "elevationOffset": elevation_offset,
            "properties": properties
        }
        
        items.append(item)
    
    return items

def format_json_items(items, use_commas=True):
    """
    Format a list of items into JSON-like strings.
    
    Args:
        items (list): List of item dictionaries.
        use_commas (bool): Whether to add a comma at the beginning of each line.
        
    Returns:
        str: Formatted JSON-like string with items.
    """
    lines = []
    
    for item in items:
        item_str = json.dumps(item, indent=4)
        # Format the string to be on a single line
        item_str = item_str.replace('\n', '').replace('    ', ' ')
        
        # Add comma if needed
        if use_commas:
            lines.append(f",{item_str}")
        else:
            lines.append(f"{item_str}")
    
    return '\n'.join(lines)

def main():
    
    print("Plot/Item Generator")
    print("==================")
    
    # Get user input
    layer_id = input("Enter layer ID (e.g., 9b7e32b3-0f4f-43a5-a73d-93d73a5206cf): ")
    
    constant_axis = input("Which axis remains constant? (x/y): ").lower()
    while constant_axis not in ['x', 'y']:
        constant_axis = input("Please enter 'x' or 'y': ").lower()
    
    constant_value = int(input(f"Enter the constant {constant_axis} value: "))
    
    var_axis = 'y' if constant_axis == 'x' else 'x'
    start_value = int(input(f"Enter the start value for {var_axis}: "))
    end_value = int(input(f"Enter the end value for {var_axis}: "))
    
    num_items = int(input("Enter the number of items to generate: "))
    
    item_type = input("Enter item type (e.g., plot-standard, decorative-lamp): ")
    category = input("Enter category (e.g., plot, decorative): ")
    
    # Get width and height ranges
    width_min = float(input("Enter minimum width: "))
    width_max = float(input("Enter maximum width: "))
    height_min = float(input("Enter minimum height: "))
    height_max = float(input("Enter maximum height: "))
    
    color = input("Enter color (e.g., #d5e8d4): ")
    prefix = input("Enter ID prefix (e.g., uuid-plot-h1n): ")
    
    # Generate the items
    items = generate_items(
        layer_id=layer_id,
        constant_axis=constant_axis,
        constant_value=constant_value,
        start_value=start_value,
        end_value=end_value,
        num_items=num_items,
        item_type=item_type,
        category=category,
        width_range=(width_min, width_max),
        height_range=(height_min, height_max),
        color=color,
        prefix=prefix
    )
    
    # Format and print the items
    formatted_items = format_json_items(items)
    print("\nGenerated Items:")
    print("================")
    print(formatted_items)
    
    # Optionally save to a file
    save_option = input("\nDo you want to save the output to a file? (y/n): ").lower()
    if save_option == 'y':
        filename = input("Enter filename: ")
        if not filename.endswith('.txt'):
            filename += '.txt'
        
        with open(filename, 'w') as file:
            file.write(formatted_items)
        
        print(f"Output saved to {filename}")

if __name__ == "__main__":
    main()