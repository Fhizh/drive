document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Update welcome message
    document.querySelector('.user-profile span').textContent = `Welcome, ${currentUser.name}`;

    // Add logout button to user profile
    const userProfile = document.querySelector('.user-profile');
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'logout-btn';
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
    userProfile.appendChild(logoutBtn);

    // Handle logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Modify storage keys to be user-specific
    const userPrefix = `user_${currentUser.id}_`;
    
    // Update localStorage keys
    let files = JSON.parse(localStorage.getItem(userPrefix + 'files')) || [];
    let favorites = JSON.parse(localStorage.getItem(userPrefix + 'favorites')) || [];
    let sharedFiles = JSON.parse(localStorage.getItem(userPrefix + 'sharedFiles')) || [];

    // Update localStorage setItem calls
    function updateStorage() {
        localStorage.setItem(userPrefix + 'files', JSON.stringify(files));
        localStorage.setItem(userPrefix + 'favorites', JSON.stringify(favorites));
        localStorage.setItem(userPrefix + 'sharedFiles', JSON.stringify(sharedFiles));
    }

    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileList = document.getElementById('fileList');
    const modal = document.getElementById('previewModal');
    const closeModal = document.querySelector('.close-modal');
    const previewContent = document.getElementById('previewContent');
    const previewFileName = document.getElementById('previewFileName');

    // Add new state variables
    let currentView = 'home';

    // Update navigation handling
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            currentView = link.dataset.view;
            updateView();
        });
    });

    function updateView() {
        const sectionTitle = document.querySelector('.section-header h2');
        const uploadSection = document.querySelector('.upload-section');
        const filesSection = document.querySelector('.files-section');
        const profileSection = document.querySelector('.profile-section');
        
        // Hide all sections first
        uploadSection.style.display = 'none';
        filesSection.style.display = 'none';
        profileSection.classList.add('hidden');
        
        switch(currentView) {
            case 'home':
                sectionTitle.textContent = 'Recent Files';
                uploadSection.style.display = 'block';
                displayFiles(files);
                break;
            case 'files':
                sectionTitle.textContent = 'My Files';
                uploadSection.style.display = 'block';
                displayFiles(files);
                break;
            case 'favorites':
                sectionTitle.textContent = 'Favorite Files';
                uploadSection.style.display = 'none';
                displayFiles(files.filter(file => favorites.includes(file.name)));
                break;
            case 'shared':
                sectionTitle.textContent = 'Shared Files';
                uploadSection.style.display = 'none';
                displayFiles(sharedFiles);
                break;
            case 'profile':
                sectionTitle.textContent = 'User Profile';
                profileSection.classList.remove('hidden');
                loadProfileData();
                break;
        }
    }

    function displayFiles(filesToShow) {
        fileList.innerHTML = '';
        filesToShow.forEach((file, index) => {
            const li = document.createElement('li');
            const fileSize = formatFileSize(file.size);
            const fileIcon = getFileIcon(file.type);
            const isFavorite = favorites.includes(file.name);
            
            li.innerHTML = `
                <div class="file-info" data-index="${index}">
                    <div class="file-icon">
                        <i class="${fileIcon}"></i>
                    </div>
                    <div class="file-details">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${fileSize}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-index="${index}">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="share-btn" data-index="${index}">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <button class="download-btn" data-index="${index}">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="delete-btn" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // Add click handler for preview
            const fileInfo = li.querySelector('.file-info');
            fileInfo.addEventListener('click', () => showPreview(file));
            
            // Add click handler for download
            const downloadBtn = li.querySelector('.download-btn');
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent preview modal from opening
                downloadFile(file);
            });
            
            // Add favorite toggle handler
            const favoriteBtn = li.querySelector('.favorite-btn');
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(file.name);
                favoriteBtn.classList.toggle('active');
            });

            // Add share handler
            const shareBtn = li.querySelector('.share-btn');
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showShareModal(file);
            });
            
            fileList.appendChild(li);
        });
        
        updateStorageInfo();
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function getFileIcon(mimeType) {
        if (mimeType.includes('image')) return 'fas fa-image';
        if (mimeType.includes('pdf')) return 'fas fa-file-pdf';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'fas fa-file-word';
        if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'fas fa-file-excel';
        if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'fas fa-file-powerpoint';
        return 'fas fa-file';
    }

    function updateStorageInfo() {
        const totalStorage = 10 * 1024 * 1024 * 1024; // 10GB in bytes
        const usedStorage = files.reduce((total, file) => total + file.size, 0);
        const usedGB = (usedStorage / (1024 * 1024 * 1024)).toFixed(1);
        const usedPercentage = (usedStorage / totalStorage) * 100;

        document.querySelector('.progress').style.width = `${usedPercentage}%`;
        document.querySelector('.storage-text').textContent = 
            `${usedGB} GB of 10 GB used`;
    }

    // Handle file upload
    uploadBtn.addEventListener('click', () => {
        const selectedFiles = fileInput.files;
        
        if (selectedFiles.length === 0) {
            alert('Please select files to upload');
            return;
        }

        // Process each file
        Array.from(selectedFiles).forEach(async file => {
            try {
                // Store the file data as base64
                const base64Data = await fileToBase64(file);
                const fileInfo = {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    data: base64Data // Store the actual file data
                };
                files.push(fileInfo);
                
                // Update localStorage
                updateStorage();
                
                // Update display
                displayFiles(files);
            } catch (error) {
                console.error('Error processing file:', error);
                alert(`Error uploading ${file.name}`);
            }
        });
        
        fileInput.value = '';
    });

    // Handle file deletion
    fileList.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn')) {
            const button = e.target.closest('.delete-btn');
            const index = button.dataset.index;
            files.splice(index, 1);
            updateStorage();
            displayFiles(files);
        }
    });

    // Handle drag and drop
    const uploadBox = document.querySelector('.upload-box');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadBox.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadBox.addEventListener('dragenter', () => {
            uploadBox.classList.add('highlight');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadBox.addEventListener(eventName, () => {
            uploadBox.classList.remove('highlight');
        });
    });

    uploadBox.addEventListener('drop', (e) => {
        const droppedFiles = e.dataTransfer.files;
        fileInput.files = droppedFiles;
        uploadBtn.click();
    });

    // Add these new functions for file preview
    async function showPreview(fileInfo) {
        previewFileName.textContent = fileInfo.name;
        previewContent.innerHTML = '';
        modal.classList.add('show');

        try {
            // Use stored data if available, otherwise read the file
            const content = fileInfo.data || await fileToBase64(fileInfo);
            
            if (fileInfo.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = content;
                previewContent.appendChild(img);
            }
            else if (fileInfo.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = content;
                video.controls = true;
                previewContent.appendChild(video);
            }
            else if (fileInfo.type.startsWith('audio/')) {
                const audio = document.createElement('audio');
                audio.src = content;
                audio.controls = true;
                previewContent.appendChild(audio);
            }
            else if (fileInfo.type === 'application/pdf') {
                const embed = document.createElement('embed');
                embed.src = content;
                embed.type = 'application/pdf';
                embed.style.width = '100%';
                embed.style.height = '70vh';
                previewContent.appendChild(embed);
            }
            else if (fileInfo.type.includes('text/') || fileInfo.type.includes('application/json')) {
                const pre = document.createElement('pre');
                pre.className = 'text-preview';
                pre.textContent = await fileInfo.text();
                previewContent.appendChild(pre);
            }
            else {
                previewContent.innerHTML = `
                    <div class="unsupported-file">
                        <i class="fas fa-file fa-3x"></i>
                        <p>Preview not available for this file type</p>
                        <p>File type: ${fileInfo.type || 'Unknown'}</p>
                    </div>
                `;
            }
        } catch (error) {
            previewContent.innerHTML = `
                <div class="unsupported-file">
                    <i class="fas fa-exclamation-circle fa-3x"></i>
                    <p>Error loading preview</p>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    function readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsDataURL(file);
        });
    }

    function downloadFile(fileInfo) {
        try {
            const data = fileInfo.data;
            const blob = dataURLtoBlob(data);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileInfo.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Error downloading file');
        }
    }

    // Add helper function to convert data URL to Blob
    function dataURLtoBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    // Handle modal close
    closeModal.addEventListener('click', () => {
        modal.classList.remove('show');
        previewContent.innerHTML = '';
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            previewContent.innerHTML = '';
        }
    });

    function toggleFavorite(fileName) {
        const index = favorites.indexOf(fileName);
        if (index === -1) {
            favorites.push(fileName);
        } else {
            favorites.splice(index, 1);
        }
        updateStorage();
    }

    async function generateShareLink(fileInfo) {
        try {
            // If we already have the base64 data, use it directly
            const fileData = {
                name: fileInfo.name,
                type: fileInfo.type,
                data: fileInfo.data || await fileToBase64(fileInfo)
            };
            
            // Convert to URL-safe string
            const encodedData = encodeURIComponent(JSON.stringify(fileData));
            
            // Create the share URL
            const shareUrl = `${window.location.origin}${window.location.pathname}?shared=${encodedData}`;
            return shareUrl;
        } catch (error) {
            console.error('Error generating share link:', error);
            return null;
        }
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    function checkForSharedFile() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('shared');
        
        if (sharedData) {
            try {
                const fileData = JSON.parse(decodeURIComponent(sharedData));
                
                // Create a file object from the shared data
                const byteString = atob(fileData.data.split(',')[1]);
                const arrayBuffer = new ArrayBuffer(byteString.length);
                const byteArray = new Uint8Array(arrayBuffer);
                
                for (let i = 0; i < byteString.length; i++) {
                    byteArray[i] = byteString.charCodeAt(i);
                }
                
                const blob = new Blob([arrayBuffer], { type: fileData.type });
                const file = new File([blob], fileData.name, { type: fileData.type });
                
                // Show the preview modal for the shared file
                showPreview(file);
                
                // Optionally add to shared files list
                if (!sharedFiles.find(f => f.name === file.name)) {
                    sharedFiles.push(file);
                    updateStorage();
                    updateView();
                }
                
                // Clear the URL parameters
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (error) {
                console.error('Error processing shared file:', error);
                alert('Error loading shared file. The link might be invalid or corrupted.');
            }
        }
    }

    function showShareModal(file) {
        const shareModal = document.createElement('div');
        shareModal.className = 'modal show';
        shareModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Share "${file.name}"</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="share-options">
                        <div class="share-link-container">
                            <input type="text" id="shareLink" readonly placeholder="Generating share link...">
                            <button class="copy-btn" id="copyBtn" disabled>
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                        <div class="share-info">
                            <i class="fas fa-info-circle"></i>
                            <span>This link contains the actual file data and can be shared directly</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(shareModal);
        
        const closeBtn = shareModal.querySelector('.close-modal');
        const copyBtn = shareModal.querySelector('#copyBtn');
        const shareLinkInput = shareModal.querySelector('#shareLink');
        
        // Generate the share link
        generateShareLink(file).then(link => {
            if (link) {
                shareLinkInput.value = link;
                copyBtn.disabled = false;
            } else {
                shareLinkInput.value = 'Error generating share link';
            }
        });
        
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(shareModal);
        });
        
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(shareLinkInput.value);
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                }, 2000);
            } catch (err) {
                shareLinkInput.select();
                document.execCommand('copy');
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                }, 2000);
            }
        });
    }

    // Initial display of files
    displayFiles(files);

    // Check for shared files when the page loads
    checkForSharedFile();

    // Add these new functions
    function loadProfileData() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;

        // Update profile information
        document.getElementById('profileName').textContent = currentUser.name;
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('nameInput').value = currentUser.name;
        document.getElementById('emailInput').value = currentUser.email;
        document.getElementById('schoolInput').value = currentUser.school || '';
        document.getElementById('subjectInput').value = currentUser.subject || '';

        // Update stats
        document.getElementById('totalFiles').textContent = files.length;
        document.getElementById('totalFavorites').textContent = favorites.length;
        document.getElementById('totalShared').textContent = sharedFiles.length;

        // Handle profile form submission
        document.getElementById('profileForm').addEventListener('submit', updateProfile);
    }

    function updateProfile(e) {
        e.preventDefault();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        const updatedUser = {
            ...currentUser,
            name: document.getElementById('nameInput').value,
            email: document.getElementById('emailInput').value,
            school: document.getElementById('schoolInput').value,
            subject: document.getElementById('subjectInput').value
        };

        // Update password if provided
        const newPassword = document.getElementById('newPassword').value;
        if (newPassword) {
            updatedUser.password = newPassword;
        }

        // Update user in users array
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        users[userIndex] = updatedUser;

        // Save changes
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        // Update display name in header
        document.querySelector('.user-profile span').textContent = `Welcome, ${updatedUser.name}`;

        alert('Profile updated successfully!');
    }

    // Add avatar change functionality
    document.getElementById('avatarInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                currentUser.avatar = e.target.result;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Update avatar display
                document.getElementById('profileAvatar').src = e.target.result;
                document.querySelector('.user-profile img').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}); 