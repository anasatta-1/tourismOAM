// User Management Page JavaScript

let allGuests = [];
let currentFilter = 'all';
let selectedGuestId = null;
let selectedPackageId = null;
let currentGuestInfo = null; // Store current guest info for contract generation

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await loadGuests();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            filterGuests();
        });
    });

    // Search input
    document.getElementById('searchInput').addEventListener('input', filterGuests);

    // Modal close buttons
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('guestDetailModal').classList.remove('active');
    });

    document.getElementById('closePaymentModal').addEventListener('click', () => {
        document.getElementById('paymentModal').classList.remove('active');
    });

    // Close modal on outside click
    document.getElementById('guestDetailModal').addEventListener('click', (e) => {
        if (e.target.id === 'guestDetailModal') {
            e.target.classList.remove('active');
        }
    });

    document.getElementById('paymentModal').addEventListener('click', (e) => {
        if (e.target.id === 'paymentModal') {
            e.target.classList.remove('active');
        }
    });
}

// Load all guests
async function loadGuests() {
    try {
        const response = await api.getGuests({ limit: 1000 });
        if (response.success) {
            allGuests = response.data.data || response.data;
            displayGuests(allGuests);
        }
    } catch (error) {
        console.error('Error loading guests:', error);
        document.getElementById('guestsTableBody').innerHTML = 
            '<tr><td colspan="6" class="loading-text">Error loading users. Please try again.</td></tr>';
    }
}

// Display guests in table
function displayGuests(guests) {
    const tbody = document.getElementById('guestsTableBody');
    
    if (guests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-text">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = guests.map(guest => `
        <tr onclick="proceedToPayment(${guest.guest_id})" style="cursor: pointer;">
            <td>${escapeHtml(guest.full_name)}</td>
            <td>${escapeHtml(guest.phone_number)}</td>
            <td>${escapeHtml(guest.country_of_residence)}</td>
            <td><span class="status-badge ${guest.status}">${guest.status}</span></td>
            <td>${guest.packages_count || 0}</td>
        </tr>
    `).join('');
}

// Filter guests by phone number only
function filterGuests() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = allGuests.filter(guest => {
        const matchesFilter = currentFilter === 'all' || guest.status === currentFilter;
        const matchesSearch = !searchTerm || 
            guest.phone_number.toLowerCase().includes(searchTerm);
        return matchesFilter && matchesSearch;
    });
    
    displayGuests(filtered);
}

// Show guest details
async function showGuestDetails(guestId) {
    try {
        const response = await api.getGuest(guestId);
        if (response.success) {
            const guest = response.data;
            selectedGuestId = guestId;
            
            const modalContent = document.getElementById('guestDetailContent');
            modalContent.innerHTML = `
                <div class="guest-detail-section">
                    <h3>Guest Information</h3>
                    <div class="detail-row">
                        <div class="detail-label">Full Name:</div>
                        <div class="detail-value">${escapeHtml(guest.full_name)}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Phone Number:</div>
                        <div class="detail-value">${escapeHtml(guest.phone_number)}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Country:</div>
                        <div class="detail-value">${escapeHtml(guest.country_of_residence)}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Status:</div>
                        <div class="detail-value"><span class="status-badge ${guest.status}">${guest.status}</span></div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Created:</div>
                        <div class="detail-value">${new Date(guest.created_at).toLocaleDateString()}</div>
                    </div>
                </div>
                
                ${guest.packages && guest.packages.length > 0 ? `
                <div class="guest-detail-section">
                    <h3>Packages (${guest.packages.length})</h3>
                    ${guest.packages.map(pkg => `
                        <div class="package-item">
                            <h4>Package #${pkg.package_id}${pkg.package_name ? ': ' + escapeHtml(pkg.package_name) : ''}</h4>
                            <div class="package-info">
                                <div><strong>Status:</strong> ${pkg.status}</div>
                                <div><strong>Total Cost:</strong> $${parseFloat(pkg.total_estimated_cost || 0).toFixed(2)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : '<div class="guest-detail-section"><p>No packages found</p></div>'}
                
                ${guest.status === 'guest' ? `
                <div class="proceed-payment-section">
                    <button class="btn btn-primary" onclick="proceedToPayment(${guestId})">Proceed to Payment</button>
                </div>
                ` : ''}
            `;
            
            document.getElementById('modalGuestName').textContent = guest.full_name;
            document.getElementById('guestDetailModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading guest details:', error);
        alert('Error loading guest details: ' + error.message);
    }
}

// Proceed to payment
async function proceedToPayment(guestId) {
    try {
        const response = await api.request(`/guests/${guestId}/payment-info`);
        if (response.success) {
            const { guest, packages } = response.data;
            selectedGuestId = guestId;
            currentGuestInfo = guest; // Store guest info for contract operations
            
            // Find the first package with a contract (or first package if no contract)
            const packageWithContract = packages.find(pkg => pkg.contract) || packages[0];
            selectedPackageId = packageWithContract ? packageWithContract.package_id : null;
            
            if (!selectedPackageId) {
                alert('No packages found for this guest');
                return;
            }
            
            const packageData = packageWithContract;
            const contract = packageData.contract;
            
            const paymentContent = document.getElementById('paymentContent');
            paymentContent.innerHTML = `
                <div class="payment-summary">
                    <h3>Payment Summary</h3>
                    <div class="payment-summary-row">
                        <span>Package Total:</span>
                        <span>$${parseFloat(packageData.total_estimated_cost || 0).toFixed(2)}</span>
                    </div>
                    <div class="payment-summary-row">
                        <span>Total Paid:</span>
                        <span>$${parseFloat(packageData.total_paid || 0).toFixed(2)}</span>
                    </div>
                    <div class="payment-summary-row">
                        <span>Remaining Balance:</span>
                        <span>$${parseFloat(packageData.remaining_balance || 0).toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="contract-section">
                    <h3>Contract</h3>
                    ${contract ? `
                        <div class="detail-row">
                            <div class="detail-label">Contract Status:</div>
                            <div class="detail-value">${contract.status}</div>
                        </div>
                        <div class="contract-actions">
                            <button class="btn btn-primary" onclick="viewContractInline(${selectedPackageId}, '${escapeHtml(guest.full_name).replace(/'/g, "\\'")}', '${escapeHtml(guest.phone_number).replace(/'/g, "\\'")}', '${escapeHtml(guest.country_of_residence).replace(/'/g, "\\'")}')">View Contract</button>
                            <button class="btn btn-secondary" onclick="downloadContractPDF(${selectedPackageId})">Download PDF</button>
                        </div>
                        <div class="contract-viewer-container" id="contractViewerContainer">
                            <div class="contract-viewer" id="contractViewer">
                                <div class="contract-content" id="contractText">
                                    <!-- Contract content will be loaded here -->
                                </div>
                            </div>
                        </div>
                    ` : `
                        <p>No contract found for this package. Please generate a contract first.</p>
                        <button class="btn btn-primary" onclick="generateContract(${selectedPackageId}, '${escapeHtml(guest.full_name).replace(/'/g, "\\'")}', '${escapeHtml(guest.phone_number).replace(/'/g, "\\'")}', '${escapeHtml(guest.country_of_residence).replace(/'/g, "\\'")}')">Generate Contract</button>
                    `}
                </div>
                
                <div class="receipt-upload-section">
                    <h3>Upload Payment Receipt</h3>
                    <p>Upload the payment receipt to complete the payment process. Once uploaded, the guest will be converted to a client.</p>
                    
                    <div class="file-upload-area" id="fileUploadArea" onclick="document.getElementById('receiptFileInput').click()">
                        <div class="upload-icon">📄</div>
                        <div class="upload-text">Click to upload or drag and drop</div>
                        <div class="upload-hint">PDF, JPG, PNG (Max 5MB)</div>
                    </div>
                    <input type="file" id="receiptFileInput" class="file-upload-input" accept=".pdf,.jpg,.jpeg,.png" onchange="handleFileSelect(event)">
                    
                    <div class="file-preview" id="filePreview">
                        <div class="file-preview-name" id="fileName"></div>
                        <button class="file-preview-remove" onclick="clearFileSelection()">Remove</button>
                    </div>
                    
                    <div style="margin-top: 1.5rem;">
                        <button class="btn btn-primary" id="uploadReceiptBtn" onclick="uploadReceipt(${selectedPackageId})" disabled>Upload Receipt</button>
                    </div>
                </div>
            `;
            
            // Setup file upload drag and drop
            setupFileUpload();
            
            // Close guest detail modal if open
            document.getElementById('guestDetailModal').classList.remove('active');
            
            // Show payment modal
            document.getElementById('paymentModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading payment info:', error);
        alert('Error loading payment information: ' + error.message);
    }
}

// View contract inline with guest information
async function viewContractInline(packageId, guestName, guestPhone, guestCountry) {
    const contractViewerContainer = document.getElementById('contractViewerContainer');
    const contractText = document.getElementById('contractText');
    
    try {
        // Get contract data
        let contractResponse;
        try {
            contractResponse = await api.getContract(packageId);
        } catch (error) {
            // If contract doesn't exist, create a new one with template
            const contractTemplate = generateContractTemplate(guestName, guestPhone, guestCountry);
            contractResponse = await api.createContract(packageId, {
                notes: contractTemplate
            });
        }
        
        if (contractResponse.success) {
            const contractData = contractResponse.data;
            let contractContent = contractData.notes;
            
            // If no notes, generate template with guest info
            if (!contractContent || contractContent.trim() === '') {
                contractContent = generateContractTemplate(guestName, guestPhone, guestCountry);
            }
            
            // Display contract
            contractText.textContent = contractContent;
            contractViewerContainer.classList.add('active');
            
            // Scroll to contract viewer
            contractViewerContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    } catch (error) {
        console.error('Error loading contract:', error);
        alert('Error loading contract: ' + error.message);
    }
}

// Generate contract template with guest information
function generateContractTemplate(guestName, guestPhone, guestCountry) {
    const today = new Date().toLocaleDateString();
    return `TRAVEL PACKAGE CONTRACT

This contract ("Contract") is entered into on ${today} between Tourism Admin ("Company") and the client ("Client").

CLIENT INFORMATION:
Name: ${guestName}
Phone: ${guestPhone}
Country of Residence: ${guestCountry}

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
Date: _______________              Date: ${today}`;
}

// Download contract as PDF
async function downloadContractPDF(packageId) {
    try {
        if (typeof html2pdf === 'undefined') {
            throw new Error('PDF library not loaded. Please refresh the page and try again.');
        }
        
        const contractViewer = document.getElementById('contractViewer');
        if (!contractViewer) {
            throw new Error('Contract viewer not found');
        }
        
        // Make sure contract is visible
        const contractViewerContainer = document.getElementById('contractViewerContainer');
        if (!contractViewerContainer.classList.contains('active')) {
            // Try to load and show contract first with current guest info
            if (currentGuestInfo) {
                await viewContractInline(packageId, currentGuestInfo.full_name || '', currentGuestInfo.phone_number || '', currentGuestInfo.country_of_residence || '');
            } else {
                await viewContractInline(packageId, '', '', '');
            }
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for rendering
        }
        
        // Ensure contract viewer is visible and properly styled for PDF
        contractViewerContainer.style.display = 'block';
        contractViewerContainer.classList.add('active');
        
        // Configure PDF options
        const opt = {
            margin: [15, 15, 15, 15],
            filename: `contract-${packageId}.pdf`,
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
                       onclone: function(clonedDoc) {
                           // Ensure off-white background and black text for PDF
                           const clonedViewer = clonedDoc.getElementById('contractViewer');
                           if (clonedViewer) {
                               clonedViewer.style.display = 'block';
                               clonedViewer.style.backgroundColor = '#f5f5f5'; // Off-white background
                               clonedViewer.style.color = '#000000'; // Black text
                               clonedViewer.style.padding = '2rem';
                               clonedViewer.style.border = '1px solid #ddd';
                               clonedViewer.style.borderRadius = '10px';
                           }
                           const clonedContractText = clonedDoc.getElementById('contractText');
                           if (clonedContractText) {
                               clonedContractText.style.color = '#000000'; // Black text
                               clonedContractText.style.backgroundColor = 'transparent';
                           }
                           // Force all text elements within contract to be black
                           const allElements = clonedViewer?.querySelectorAll('*') || [];
                           allElements.forEach(el => {
                               const computedStyle = clonedDoc.defaultView.getComputedStyle(el);
                               if (computedStyle.color && computedStyle.color !== 'rgb(0, 0, 0)') {
                                   el.style.color = '#000000';
                               }
                           });
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
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF: ' + error.message);
    }
}

// Generate contract with guest information
async function generateContract(packageId, guestName = '', guestPhone = '', guestCountry = '') {
    try {
        // Generate contract template with guest info
        const contractTemplate = generateContractTemplate(guestName, guestPhone, guestCountry);
        
        const response = await api.createContract(packageId, {
            notes: contractTemplate
        });
        if (response.success) {
            alert('Contract generated successfully');
            proceedToPayment(selectedGuestId); // Reload payment info
        }
    } catch (error) {
        console.error('Error generating contract:', error);
        alert('Error generating contract: ' + error.message);
    }
}

let selectedFile = null;

// Setup file upload drag and drop
function setupFileUpload() {
    const uploadArea = document.getElementById('fileUploadArea');
    if (!uploadArea) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.add('dragover'), false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('dragover'), false);
    });
    
    uploadArea.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(event) {
    if (event.target.files.length > 0) {
        handleFile(event.target.files[0]);
    }
}

function handleFile(file) {
    if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
    }
    
    selectedFile = file;
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('filePreview').classList.add('active');
    document.getElementById('uploadReceiptBtn').disabled = false;
}

function clearFileSelection() {
    selectedFile = null;
    document.getElementById('receiptFileInput').value = '';
    document.getElementById('filePreview').classList.remove('active');
    document.getElementById('uploadReceiptBtn').disabled = true;
}

// Upload receipt
async function uploadReceipt(packageId) {
    if (!selectedFile) {
        alert('Please select a file first');
        return;
    }
    
    try {
        // First, create a payment record if needed
        // For now, we'll try to upload to the first payment or create one
        const paymentsResponse = await api.request(`/packages/${packageId}/payments`);
        let paymentId = null;
        
        if (paymentsResponse.success && paymentsResponse.data.payments && paymentsResponse.data.payments.length > 0) {
            // Use the first payment
            paymentId = paymentsResponse.data.payments[0].payment_id;
        } else {
            // Create a new payment record
            const packageResponse = await api.getPackage(packageId);
            if (packageResponse.success) {
                const packageData = packageResponse.data;
                const paymentAmount = packageData.total_estimated_cost || 0;
                
                const createPaymentResponse = await api.request(`/packages/${packageId}/payments`, {
                    method: 'POST',
                    body: JSON.stringify({
                        payment_amount: paymentAmount,
                        payment_date: new Date().toISOString().split('T')[0]
                    })
                });
                
                if (createPaymentResponse.success) {
                    paymentId = createPaymentResponse.data.payment_id;
                }
            }
        }
        
        if (!paymentId) {
            alert('Error: Could not create or find payment record');
            return;
        }
        
        // Upload receipt
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const uploadBtn = document.getElementById('uploadReceiptBtn');
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';
        
        const uploadResponse = await api.request(`/packages/${packageId}/payments/${paymentId}/receipt`, {
            method: 'POST',
            body: formData
        });
        
        if (uploadResponse.success) {
            alert('Receipt uploaded successfully! Guest status has been updated to Client.');
            document.getElementById('paymentModal').classList.remove('active');
            await loadGuests(); // Reload guests list
        }
    } catch (error) {
        console.error('Error uploading receipt:', error);
        alert('Error uploading receipt: ' + error.message);
        document.getElementById('uploadReceiptBtn').disabled = false;
        document.getElementById('uploadReceiptBtn').textContent = 'Upload Receipt';
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
