// Contract Page JavaScript

let packageId = null;
let contractData = null;
let isEditMode = false;
let originalContent = '';

// Default contract template
const DEFAULT_CONTRACT_TEMPLATE = `TRAVEL PACKAGE CONTRACT

This contract ("Contract") is entered into on ${new Date().toLocaleDateString()} between Tourism Admin ("Company") and the client ("Client").

1. PACKAGE DETAILS
The Company agrees to provide the Client with the travel package services as specified in the associated quotation.

2. PAYMENT TERMS
Payment shall be made according to the schedule outlined in the quotation. All payments are due as specified.

3. CANCELLATION POLICY
Cancellation terms and conditions apply as per the Company's standard cancellation policy.

4. LIABILITY
The Company shall not be liable for any delays, cancellations, or changes due to circumstances beyond its control, including but not limited to weather conditions, natural disasters, or government actions.

5. TERMS AND CONDITIONS
By signing this contract, the Client agrees to all terms and conditions outlined herein and in the associated travel package documentation.

6. SIGNATURES
This contract shall be binding upon signature by both parties.

_________________________          _________________________
Client Signature                    Company Representative
Date: _______________              Date: _______________`;

// Check if page is accessed with package ID
document.addEventListener('DOMContentLoaded', async () => {
    // Get package ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    packageId = urlParams.get('package_id');
    
    // Also check sessionStorage (set by other pages)
    if (!packageId) {
        packageId = sessionStorage.getItem('contractPackageId');
    }
    
    if (!packageId) {
        showError('No package ID provided. Please access this page from a package or provide package_id in the URL.');
        return;
    }
    
    // Clear the session storage after reading
    sessionStorage.removeItem('contractPackageId');
    
    // Load contract data
    await loadContract();
});

// Show error message
function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('contract-content').style.display = 'none';
    document.getElementById('error-message').style.display = 'block';
    if (message) {
        document.getElementById('error-text').textContent = message;
    }
}

// Load contract data
async function loadContract() {
    try {
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('contract-content').style.display = 'none';
        document.getElementById('error-message').style.display = 'none';
        
        // Try to get existing contract
        let contractResponse;
        try {
            contractResponse = await api.getContract(packageId);
        } catch (error) {
            // If contract doesn't exist, create a new one
            console.log('Contract not found, creating new contract...');
            contractResponse = await api.createContract(packageId, {
                notes: DEFAULT_CONTRACT_TEMPLATE
            });
        }
        
        if (!contractResponse.success) {
            throw new Error(contractResponse.message || 'Failed to load contract');
        }
        
        contractData = contractResponse.data;
        
        // Load contract content (use notes field or default template)
        const contractContent = contractData.notes || DEFAULT_CONTRACT_TEMPLATE;
        originalContent = contractContent;
        
        // Display contract
        displayContract(contractContent);
        
        // Setup action buttons
        setupActionButtons();
        
    } catch (error) {
        console.error('Error loading contract:', error);
        showError(error.message || 'An error occurred while loading the contract.');
    }
}

// Display contract content
function displayContract(content) {
    // Hide loading, show content
    document.getElementById('loading').style.display = 'none';
    document.getElementById('contract-content').style.display = 'block';
    
    const contractTextElement = document.getElementById('contract-text');
    // Use textContent to preserve line breaks and formatting
    contractTextElement.textContent = content;
    contractTextElement.setAttribute('contenteditable', 'false');
    
    // Update button text
    updateEditButton();
}

// Setup action buttons
function setupActionButtons() {
    // Edit button - Toggle edit mode
    document.getElementById('edit-btn').addEventListener('click', toggleEditMode);
    
    // Download PDF button
    document.getElementById('download-pdf-btn').addEventListener('click', downloadPDF);
}

// Toggle edit mode
function toggleEditMode() {
    const contractTextElement = document.getElementById('contract-text');
    isEditMode = !isEditMode;
    
    if (isEditMode) {
        // Enter edit mode
        contractTextElement.setAttribute('contenteditable', 'true');
        contractTextElement.focus();
        
        // Save original content if not already saved
        if (!originalContent) {
            originalContent = contractTextElement.textContent;
        }
    } else {
        // Exit edit mode - save changes
        contractTextElement.setAttribute('contenteditable', 'false');
        
        // Update original content with current content
        originalContent = contractTextElement.textContent;
        
        // Optionally save to backend (using notes field)
        saveContractContent(originalContent).catch(error => {
            console.error('Error saving contract:', error);
            // Don't show error to user, just log it
        });
    }
    
    updateEditButton();
}

// Update edit button text
function updateEditButton() {
    const editBtn = document.getElementById('edit-btn');
    if (isEditMode) {
        editBtn.textContent = 'Save';
        editBtn.classList.remove('btn-primary');
        editBtn.classList.add('btn-secondary');
    } else {
        editBtn.textContent = 'Edit';
        editBtn.classList.remove('btn-secondary');
        editBtn.classList.add('btn-primary');
    }
}

// Save contract content to backend
async function saveContractContent(content) {
    if (!contractData) {
        return;
    }
    
    try {
        // Update contract notes with new content
        await api.updateContract(packageId, {
            notes: content
        });
    } catch (error) {
        console.error('Error saving contract content:', error);
        throw error;
    }
}

// Download PDF
async function downloadPDF() {
    try {
        // Check if html2pdf is loaded
        if (typeof html2pdf === 'undefined') {
            throw new Error('PDF library not loaded. Please refresh the page and try again.');
        }
        
        // Show loading state
        const btn = document.getElementById('download-pdf-btn');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Generating PDF...';
        
        // Get the contract viewer element
        const contractViewer = document.getElementById('contract-viewer');
        
        if (!contractViewer) {
            throw new Error('Contract viewer not found');
        }
        
        // Ensure content is visible
        const originalDisplay = contractViewer.style.display;
        contractViewer.style.display = 'block';
        
        // Exit edit mode if active (to show final content)
        if (isEditMode) {
            const contractTextElement = document.getElementById('contract-text');
            contractTextElement.setAttribute('contenteditable', 'false');
            originalContent = contractTextElement.textContent;
            isEditMode = false;
            updateEditButton();
        }
        
        // Hide action buttons for PDF
        const actionButtons = document.querySelector('.contract-actions');
        const originalActionDisplay = actionButtons ? actionButtons.style.display : '';
        if (actionButtons) {
            actionButtons.style.display = 'none';
        }
        
        // Scroll to top to ensure content is in view
        window.scrollTo(0, 0);
        
        // Wait for any pending renders
        await new Promise(resolve => {
            // Force browser to render
            void contractViewer.offsetHeight;
            setTimeout(resolve, 200);
        });
        
        // Configure PDF options
        const opt = {
            margin: [15, 15, 15, 15],
            filename: `contract-${packageId || 'draft'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#f5f5f5', // Off-white background for PDF compatibility
                windowWidth: contractViewer.scrollWidth || window.innerWidth,
                windowHeight: contractViewer.scrollHeight || window.innerHeight,
                allowTaint: true,
                letterRendering: true,
                removeContainer: true,
                onclone: (clonedDoc) => {
                    // Ensure off-white background and black text for PDF
                    const clonedViewer = clonedDoc.getElementById('contract-viewer') || clonedDoc.querySelector('.contract-viewer');
                    if (clonedViewer) {
                        clonedViewer.style.backgroundColor = '#f5f5f5';
                        clonedViewer.style.color = '#000000';
                        // Force all text elements to be black
                        const allElements = clonedViewer.querySelectorAll('*');
                        allElements.forEach(el => {
                            const computedStyle = clonedDoc.defaultView.getComputedStyle(el);
                            if (computedStyle.color && computedStyle.color !== 'rgb(0, 0, 0)') {
                                el.style.color = '#000000';
                            }
                            if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                                // Keep backgrounds transparent or white
                                if (computedStyle.backgroundColor.includes('rgb(26, 26, 26)') || 
                                    computedStyle.backgroundColor.includes('rgb(10, 14, 20)')) {
                                    el.style.backgroundColor = '#f5f5f5';
                                }
                            }
                        });
                    }
                }
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait',
                compress: true
            },
            pagebreak: { 
                mode: ['avoid-all', 'css', 'legacy']
            }
        };
        
        // Generate and download PDF
        await html2pdf().set(opt).from(contractViewer).save();
        
        // Restore original display
        contractViewer.style.display = originalDisplay;
        if (actionButtons) {
            actionButtons.style.display = originalActionDisplay || '';
        }
        
        // Restore button state
        btn.disabled = false;
        btn.textContent = originalText;
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF: ' + error.message);
        
        // Restore button state
        const btn = document.getElementById('download-pdf-btn');
        btn.disabled = false;
        btn.textContent = 'Download PDF';
        
        // Restore action buttons if hidden
        const actionButtons = document.querySelector('.contract-actions');
        if (actionButtons) {
            actionButtons.style.display = '';
        }
    }
}

