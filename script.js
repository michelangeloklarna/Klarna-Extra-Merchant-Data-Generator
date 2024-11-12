class EMDGenerator {
    constructor(schema) {
        this.schema = schema;
        this.initializeUI();
    }

    initializeUI() {
        const accordion = document.getElementById('emdAccordion');
        let index = 0;

        for (const [key, value] of Object.entries(this.schema.properties)) {
            const section = this.createSection(key, value, index++);
            accordion.appendChild(section);
        }
    }

    createSection(key, schema, index) {
        const section = document.createElement('div');
        section.className = 'accordion-item';
        
        const title = schema.description?.split('.')[0] || key;
        
        section.innerHTML = `
            <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                        data-bs-target="#section${index}">
                    ${title}
                </button>
            </h2>
            <div id="section${index}" class="accordion-collapse collapse">
                <div class="accordion-body">
                    <div class="form-section" id="${key}">
                        <div class="button-group mb-3">
                            <button class="btn btn-sm btn-primary" onclick="addMainItem('${key}')">
                                Add ${this.formatLabel(key)}
                            </button>
                            <button class="btn btn-sm btn-success ms-2" onclick="populateExampleData('${key}')">
                                Auto Generate
                            </button>
                        </div>
                        <div class="array-items"></div>
                    </div>
                </div>
            </div>
        `;

        return section;
    }

    createFormForObject(schema) {
        const form = document.createElement('div');
        form.className = 'row g-3';

        for (const [key, prop] of Object.entries(schema.properties)) {
            const col = document.createElement('div');
            col.className = prop.type === 'array' ? 'col-12' : 'col-md-6';

            if (prop.type === 'array') {
                const arrayContainer = document.createElement('div');
                arrayContainer.className = 'nested-array mb-3';
                
                const arrayLabel = document.createElement('label');
                arrayLabel.className = 'form-label';
                arrayLabel.textContent = this.formatLabel(key);
                
                const addButton = document.createElement('button');
                addButton.className = 'btn btn-sm btn-success ms-2';
                addButton.textContent = `Add ${this.formatLabel(key)}`;
                addButton.onclick = () => this.addNestedItem(arrayContainer, prop.items);
                
                const itemsContainer = document.createElement('div');
                itemsContainer.className = 'array-items';
                
                arrayContainer.appendChild(arrayLabel);
                arrayContainer.appendChild(addButton);
                arrayContainer.appendChild(itemsContainer);
                
                col.appendChild(arrayContainer);
            } else if (prop.type === 'object') {
                const objectContainer = document.createElement('div');
                objectContainer.className = 'nested-object mb-3';
                
                const objectLabel = document.createElement('label');
                objectLabel.className = 'form-label';
                objectLabel.textContent = this.formatLabel(key);
                
                const objectForm = this.createFormForObject(prop);
                objectForm.className = 'p-3 border rounded';
                
                objectContainer.appendChild(objectLabel);
                objectContainer.appendChild(objectForm);
                
                col.appendChild(objectContainer);
            } else {
                const input = this.createInputField(key, prop);
                col.appendChild(input);
            }

            form.appendChild(col);
        }

        return form;
    }

    createInputField(key, schema) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';

        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = this.formatLabel(key);

        let input;
        if (schema.type === 'array' && schema.items.type === 'integer') {
            // Special handling for integer arrays like passenger_id
            input = document.createElement('input');
            input.className = 'form-control';
            input.type = 'text';
            input.placeholder = 'Enter numbers separated by commas (e.g., 1,2,3)';
            input.dataset.arrayType = 'integer';
        } else if (schema.type === 'boolean') {
            // Special handling for boolean values
            input = document.createElement('select');
            input.className = 'form-select';
            
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select...';
            
            const trueOption = document.createElement('option');
            trueOption.value = 'true';
            trueOption.textContent = 'True';
            
            const falseOption = document.createElement('option');
            falseOption.value = 'false';
            falseOption.textContent = 'False';
            
            input.appendChild(defaultOption);
            input.appendChild(trueOption);
            input.appendChild(falseOption);
            
            input.dataset.type = 'boolean';
        } else if (schema.enum) {
            input = document.createElement('select');
            input.className = 'form-select';
            
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select...';
            input.appendChild(defaultOption);

            schema.enum.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                input.appendChild(option);
            });
        } else {
            input = document.createElement('input');
            input.className = 'form-control';
            input.type = this.getInputType(schema);

            // Add validation attributes
            if (schema.minLength) input.minLength = schema.minLength;
            if (schema.maxLength) input.maxLength = schema.maxLength;
            if (schema.pattern) input.pattern = schema.pattern;

            // Add validation message container
            const validationMessage = document.createElement('div');
            validationMessage.className = 'invalid-feedback';
            wrapper.appendChild(validationMessage);

            // Add validation rules text
            if (schema.minLength || schema.maxLength) {
                const rulesText = document.createElement('small');
                rulesText.className = 'form-text text-muted';
                if (schema.minLength === schema.maxLength) {
                    rulesText.textContent = `Must be exactly ${schema.minLength} characters`;
                } else {
                    rulesText.textContent = `Length: ${schema.minLength || 0} - ${schema.maxLength || 'unlimited'} characters`;
                }
                wrapper.appendChild(rulesText);
            }

            // Add input validation event listeners
            input.addEventListener('input', () => this.validateInput(input, schema, validationMessage));
            input.addEventListener('blur', () => this.validateInput(input, schema, validationMessage));
        }

        input.id = key;
        input.name = key;

        if (schema.description) {
            const helpText = document.createElement('small');
            helpText.className = 'form-text text-muted';
            helpText.innerHTML = schema.description;
            wrapper.appendChild(helpText);
        }

        wrapper.appendChild(label);
        wrapper.appendChild(input);

        return wrapper;
    }

    validateInput(input, schema, validationMessage) {
        let isValid = true;
        let message = '';

        // Remove previous validation classes
        input.classList.remove('is-invalid', 'is-valid');

        if (input.value) {
            // Length validation
            if (schema.minLength && input.value.length < schema.minLength) {
                isValid = false;
                message = `Must be at least ${schema.minLength} characters`;
            }
            if (schema.maxLength && input.value.length > schema.maxLength) {
                isValid = false;
                message = `Must not exceed ${schema.maxLength} characters`;
            }

            // Pattern validation
            if (schema.pattern && !new RegExp(schema.pattern).test(input.value)) {
                isValid = false;
                if (schema.format === 'date-time') {
                    message = 'Invalid date format';
                } else {
                    message = 'Invalid format';
                }
            }

            // Type validation
            if (schema.type === 'number' || schema.type === 'integer') {
                const num = Number(input.value);
                if (isNaN(num)) {
                    isValid = false;
                    message = 'Must be a number';
                } else if (schema.type === 'integer' && !Number.isInteger(num)) {
                    isValid = false;
                    message = 'Must be an integer';
                }
            }
        }

        // Apply validation classes and message
        input.classList.add(isValid ? 'is-valid' : 'is-invalid');
        validationMessage.textContent = message;
    }

    addNestedItem(container, schema) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'array-item';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-sm btn-danger remove-item';
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => itemDiv.remove();
        
        const form = this.createFormForObject(schema);
        
        itemDiv.appendChild(removeBtn);
        itemDiv.appendChild(form);
        container.querySelector('.array-items').appendChild(itemDiv);
    }

    getInputType(schema) {
        if (schema.format === 'date-time') return 'datetime-local';
        if (schema.type === 'number' || schema.type === 'integer') return 'number';
        if (schema.type === 'boolean') return 'checkbox';
        return 'text';
    }

    formatLabel(key) {
        return key.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
}

function addMainItem(key) {
    const section = document.querySelector(`#${key} .array-items`);
    const schema = emdSchema.properties[key].items;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'array-item';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-sm btn-danger remove-item';
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = () => itemDiv.remove();
    
    const form = emdGenerator.createFormForObject(schema);
    
    itemDiv.appendChild(removeBtn);
    itemDiv.appendChild(form);
    section.appendChild(itemDiv);
}

function generateEMD() {
    const output = {};
    
    for (const [key, schema] of Object.entries(emdSchema.properties)) {
        const section = document.querySelector(`#${key}`);
        if (!section) continue;

        const items = [];
        section.querySelectorAll('.array-item').forEach(item => {
            const itemData = processItem(item);
            if (Object.keys(itemData).length > 0) {
                items.push(itemData);
            }
        });

        if (items.length > 0) {
            output[key] = items;
        }
    }

    document.getElementById('output').textContent = JSON.stringify(output, null, 2);
}

function processItem(item) {
    const data = {};
    
    // Process regular inputs
    item.querySelectorAll('input, select').forEach(input => {
        if (input.value) {
            if (input.dataset.arrayType === 'integer') {
                // Handle integer arrays
                data[input.name] = input.value.split(',')
                    .map(num => parseInt(num.trim()))
                    .filter(num => !isNaN(num));
            } else if (input.dataset.type === 'boolean') {
                // Handle boolean values
                data[input.name] = input.value === 'true';
            } else {
                data[input.name] = input.type === 'checkbox' ? 
                    input.checked : 
                    (input.type === 'number' ? Number(input.value) : input.value);
            }
        }
    });
    
    // Process nested arrays
    item.querySelectorAll('.nested-array').forEach(nestedArray => {
        const arrayName = nestedArray.querySelector('label').textContent
            .toLowerCase().replace(/\s+/g, '_');
        const nestedItems = [];
        
        nestedArray.querySelectorAll('.array-item').forEach(nestedItem => {
            const nestedData = processItem(nestedItem);
            if (Object.keys(nestedData).length > 0) {
                nestedItems.push(nestedData);
            }
        });
        
        if (nestedItems.length > 0) {
            data[arrayName] = nestedItems;
        }
    });
    
    return data;
}

// Add this new function to generate example data
function generateExampleData(schema) {
    if (schema.type === 'array') {
        return [generateExampleData(schema.items)];
    }
    
    if (schema.type === 'object') {
        const obj = {};
        for (const [key, prop] of Object.entries(schema.properties)) {
            obj[key] = generateExampleData(prop);
        }
        return obj;
    }

    // Generate example values based on type
    if (schema.enum) {
        return schema.enum[0];
    }

    switch (schema.type) {
        case 'string':
            if (schema.format === 'date-time') {
                return new Date().toISOString().slice(0, 16);
            }
            if (schema.minLength === 3 && schema.maxLength === 3) {
                return 'ABC'; // For IATA codes
            }
            if (schema.minLength === 2 && schema.maxLength === 2) {
                return 'AB'; // For country codes
            }
            return schema.description?.split('Example: `')[1]?.split('`')[0] || 'Example';
        case 'number':
            return 100;
        case 'integer':
            return 1;
        case 'boolean':
            return true;
        case 'array':
            if (schema.items.type === 'integer') {
                return [1, 2];
            }
            return [generateExampleData(schema.items)];
        default:
            return null;
    }
}

// Add this function to populate the form with example data
function populateExampleData(key) {
    const section = document.querySelector(`#${key}`);
    const schema = emdSchema.properties[key];
    
    // Clear existing items
    const arrayItems = section.querySelector('.array-items');
    arrayItems.innerHTML = '';
    
    // Generate and add example item
    const exampleData = generateExampleData(schema);
    addMainItem(key);
    
    // Populate the form fields
    const item = arrayItems.querySelector('.array-item');
    populateFormFields(item, exampleData[0]);
}

function populateFormFields(container, data) {
    for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
            const arrayContainer = container.querySelector(`.nested-array:has(label:contains("${key}"))`);
            if (arrayContainer) {
                value.forEach(item => {
                    const addButton = arrayContainer.querySelector('button');
                    addButton.click();
                    const lastItem = arrayContainer.querySelector('.array-item:last-child');
                    populateFormFields(lastItem, item);
                });
            }
        } else if (typeof value === 'object' && value !== null) {
            const objectContainer = container.querySelector(`.nested-object:has(label:contains("${key}"))`);
            if (objectContainer) {
                populateFormFields(objectContainer, value);
            }
        } else {
            const input = container.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.tagName === 'SELECT') {
                    input.value = value.toString();
                } else {
                    input.value = value;
                }
            }
        }
    }
}

// Initialize the generator when the page loads
const emdGenerator = new EMDGenerator(emdSchema); 