// Netlify CMS Content Loader
// This script loads content from markdown files created by Netlify CMS

async function loadNetlifyCMSContent() {
    console.log('🔄 Loading Netlify CMS content...');
    
    try {
        // Load personal information
        try {
            const personalResponse = await fetch('./content/personal.md');
            if (personalResponse.ok) {
                const personalText = await personalResponse.text();
                const personalData = parseMarkdownFrontmatter(personalText);
                updatePersonalInfo(personalData);
                console.log('✅ Personal info loaded');
            }
        } catch (error) {
            console.log('⚠️ Could not load personal.md:', error.message);
        }

        // Load hero section
        try {
            const heroResponse = await fetch('./content/hero.md');
            if (heroResponse.ok) {
                const heroText = await heroResponse.text();
                const heroData = parseMarkdownFrontmatter(heroText);
                updateHeroSection(heroData);
                console.log('✅ Hero section loaded');
            }
        } catch (error) {
            console.log('⚠️ Could not load hero.md:', error.message);
        }

        // Load about section
        try {
            const aboutResponse = await fetch('./content/about.md');
            if (aboutResponse.ok) {
                const aboutText = await aboutResponse.text();
                const aboutData = parseMarkdownFrontmatter(aboutText);
                updateAboutSection(aboutData);
                console.log('✅ About section loaded');
            }
        } catch (error) {
            console.log('⚠️ Could not load about.md:', error.message);
        }

        // Load settings
        try {
            const settingsResponse = await fetch('./content/settings.md');
            if (settingsResponse.ok) {
                const settingsText = await settingsResponse.text();
                const settingsData = parseMarkdownFrontmatter(settingsText);
                updateSiteSettings(settingsData);
                console.log('✅ Site settings loaded');
            }
        } catch (error) {
            console.log('⚠️ Could not load settings.md:', error.message);
        }

        // Load collections (education, skills, projects, etc.)
        await loadCollections();

        console.log('✅ Netlify CMS content loading completed!');
    } catch (error) {
        console.log('⚠️ Netlify CMS content not available, using defaults:', error);
        // Set some default content
        setDefaultContent();
    }
}

function setDefaultContent() {
    console.log('🔄 Setting default content...');
    
    // Set default hero content
    const homeName = document.getElementById('homeName');
    const homeTitle = document.getElementById('homeTitle');
    const homeTagline = document.getElementById('homeTagline');
    
    if (homeName && homeName.textContent.includes('<!-- Name')) {
        homeName.textContent = 'Your Name';
    }
    if (homeTitle && homeTitle.textContent.includes('<!-- Title')) {
        homeTitle.textContent = 'Your Professional Title';
    }
    if (homeTagline && homeTagline.textContent.includes('<!-- Tagline')) {
        homeTagline.textContent = 'Your professional tagline here';
    }
    
    // Set default about content
    const aboutText = document.querySelector('.about-text');
    if (aboutText && aboutText.textContent.includes('<!-- About')) {
        aboutText.innerHTML = '<p>Welcome to my portfolio! Please use the admin panel to add your personal information and content.</p>';
    }
}

function parseMarkdownFrontmatter(markdownText) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
    const match = markdownText.match(frontmatterRegex);
    
    if (!match) return {};
    
    const frontmatter = match[1];
    const data = {};
    
    // Simple YAML parser for basic key-value pairs
    const lines = frontmatter.split('\n');
    let currentKey = null;
    let currentValue = '';
    let inMultiline = false;
    
    for (const line of lines) {
        if (line.trim() === '') continue;
        
        if (line.includes('|') && !inMultiline) {
            // Start of multiline string
            currentKey = line.split(':')[0].trim();
            inMultiline = true;
            currentValue = '';
        } else if (inMultiline) {
            if (line.startsWith('  ')) {
                // Continuation of multiline string
                currentValue += (currentValue ? '\n' : '') + line.substring(2);
            } else {
                // End of multiline string
                data[currentKey] = currentValue.trim();
                inMultiline = false;
                
                // Process current line as new key-value pair
                if (line.includes(':')) {
                    const [key, value] = line.split(':').map(s => s.trim());
                    data[key] = value.replace(/^["']|["']$/g, '');
                }
            }
        } else if (line.includes(':')) {
            const [key, value] = line.split(':').map(s => s.trim());
            data[key] = value.replace(/^["']|["']$/g, '');
        }
    }
    
    // Handle last multiline if exists
    if (inMultiline && currentKey) {
        data[currentKey] = currentValue.trim();
    }
    
    return data;
}

function updatePersonalInfo(data) {
    console.log('Updating personal info:', data);
    
    if (data.fullName) {
        // Update navigation name
        const navName = document.getElementById('navName');
        if (navName) navName.textContent = data.fullName;
        
        // Update footer name
        const footerName = document.getElementById('footerName');
        if (footerName) footerName.textContent = data.fullName;
    }
    
    if (data.email) {
        const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
        emailLinks.forEach(link => {
            link.href = `mailto:${data.email}`;
            link.textContent = data.email;
        });
        
        // Update contact email display
        const contactEmail = document.getElementById('contactEmail');
        if (contactEmail) contactEmail.textContent = data.email;
    }
    
    if (data.profileImage) {
        const profileImages = document.querySelectorAll('.profile-image, #profileImage');
        profileImages.forEach(img => img.src = data.profileImage);
    }
    
    if (data.linkedin) {
        const linkedinLinks = document.querySelectorAll('a[href*="linkedin"]');
        linkedinLinks.forEach(link => link.href = data.linkedin);
    }
    
    if (data.github) {
        const githubLinks = document.querySelectorAll('a[href*="github"]');
        githubLinks.forEach(link => link.href = data.github);
    }
}

function updateHeroSection(data) {
    console.log('Updating hero section:', data);
    
    if (data.heroName) {
        const homeName = document.getElementById('homeName');
        if (homeName) homeName.textContent = data.heroName;
    }
    
    if (data.heroTitle) {
        const homeTitle = document.getElementById('homeTitle');
        if (homeTitle) homeTitle.textContent = data.heroTitle;
    }
    
    if (data.heroTagline) {
        const homeTagline = document.getElementById('homeTagline');
        if (homeTagline) homeTagline.textContent = data.heroTagline;
    }
    
    if (data.heroSubtitle) {
        const heroSubtitle = document.querySelector('.hero-subtitle');
        if (heroSubtitle) heroSubtitle.textContent = data.heroSubtitle;
    }
    
    if (data.heroButtonText && data.heroButtonUrl) {
        const heroButton = document.querySelector('.hero-button, .btn-primary');
        if (heroButton) {
            heroButton.textContent = data.heroButtonText;
            heroButton.href = data.heroButtonUrl;
        }
    }
}

function updateAboutSection(data) {
    console.log('Updating about section:', data);
    
    if (data.aboutText) {
        const aboutText = document.querySelector('.about-text, #aboutDescription');
        if (aboutText) {
            // Convert markdown to HTML (simple conversion)
            const htmlText = data.aboutText
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');
            aboutText.innerHTML = `<p>${htmlText}</p>`;
        }
    }
}

function updateSiteSettings(data) {
    if (data.siteTitle) {
        document.title = data.siteTitle;
        const titleElements = document.querySelectorAll('.site-title');
        titleElements.forEach(el => el.textContent = data.siteTitle);
    }
    
    if (data.colorScheme) {
        document.documentElement.setAttribute('data-theme', data.colorScheme);
    }
    
    if (data.metaDescription) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = data.metaDescription;
    }
}

async function loadCollections() {
    console.log('🔄 Loading collections...');
    
    try {
        // Load Education
        await loadEducation();
        
        // Load Skills  
        await loadSkills();
        
        // Load Projects
        await loadProjects();
        
        // Load Publications
        await loadPublications();
        
        // Load Podcasts
        await loadPodcasts();
        
        // Load Videos
        await loadVideos();
        
        // Load Awards
        await loadAwards();
        
        console.log('✅ All collections loaded');
    } catch (error) {
        console.log('⚠️ Error loading collections:', error);
    }
}

async function loadEducation() {
    try {
        const educationContainer = document.getElementById('educationList');
        if (!educationContainer) return;
        
        // Load file list from manifest
        const manifestResponse = await fetch('./content/manifest.json');
        if (!manifestResponse.ok) {
            console.log('⚠️ Could not load content manifest');
            return;
        }
        
        const manifest = await manifestResponse.json();
        const educationFiles = manifest.education || [];
        
        for (const filename of educationFiles) {
            try {
                const response = await fetch(`./content/education/${filename}`);
                if (response.ok) {
                    const content = await response.text();
                    const data = parseMarkdownFrontmatter(content);
                    renderEducationItem(data, educationContainer);
                }
            } catch (error) {
                console.log(`⚠️ Could not load ${filename}:`, error.message);
            }
        }
        
        console.log('✅ Education loaded');
    } catch (error) {
        console.log('⚠️ Could not load education:', error.message);
    }
}

async function loadSkills() {
    try {
        const skillsContainer = document.getElementById('allSkills');
        if (!skillsContainer) return;
        
        // Load file list from manifest
        const manifestResponse = await fetch('./content/manifest.json');
        if (!manifestResponse.ok) {
            console.log('⚠️ Could not load content manifest');
            return;
        }
        
        const manifest = await manifestResponse.json();
        const skillFiles = manifest.skills || [];
        
        for (const filename of skillFiles) {
            try {
                const response = await fetch(`./content/skills/${filename}`);
                if (response.ok) {
                    const content = await response.text();
                    const data = parseMarkdownFrontmatter(content);
                    renderSkillItem(data, skillsContainer);
                }
            } catch (error) {
                console.log(`⚠️ Could not load ${filename}:`, error.message);
            }
        }
        
        console.log('✅ Skills loaded');
    } catch (error) {
        console.log('⚠️ Could not load skills:', error.message);
    }
}

async function loadProjects() {
    try {
        const projectsContainer = document.getElementById('projectsGrid');
        if (!projectsContainer) return;
        
        // Load file list from manifest
        const manifestResponse = await fetch('./content/manifest.json');
        if (!manifestResponse.ok) {
            console.log('⚠️ Could not load content manifest');
            return;
        }
        
        const manifest = await manifestResponse.json();
        const projectFiles = manifest.projects || [];
        
        for (const filename of projectFiles) {
            try {
                const response = await fetch(`./content/projects/${filename}`);
                if (response.ok) {
                    const content = await response.text();
                    const data = parseMarkdownFrontmatter(content);
                    renderProjectItem(data, projectsContainer);
                }
            } catch (error) {
                console.log(`⚠️ Could not load ${filename}:`, error.message);
            }
        }
        
        console.log('✅ Projects loaded');
    } catch (error) {
        console.log('⚠️ Could not load projects:', error.message);
    }
}

async function loadPublications() {
    try {
        const publicationsContainer = document.getElementById('publicationsList');
        if (!publicationsContainer) return;
        
        // Load file list from manifest
        const manifestResponse = await fetch('./content/manifest.json');
        if (!manifestResponse.ok) {
            console.log('⚠️ Could not load content manifest');
            return;
        }
        
        const manifest = await manifestResponse.json();
        const publicationFiles = manifest.publications || [];
        
        for (const filename of publicationFiles) {
            try {
                const response = await fetch(`./content/publications/${filename}`);
                if (response.ok) {
                    const content = await response.text();
                    const data = parseMarkdownFrontmatter(content);
                    renderPublicationItem(data, publicationsContainer);
                }
            } catch (error) {
                console.log(`⚠️ Could not load ${filename}:`, error.message);
            }
        }
        
        console.log('✅ Publications loaded');
    } catch (error) {
        console.log('⚠️ Could not load publications:', error.message);
    }
}

async function loadPodcasts() {
    try {
        const podcastsContainer = document.getElementById('podcastsList');
        if (!podcastsContainer) return;
        
        console.log('✅ Podcasts section ready for CMS content');
    } catch (error) {
        console.log('⚠️ Could not load podcasts:', error.message);
    }
}

async function loadVideos() {
    try {
        const videosContainer = document.getElementById('videosList');
        if (!videosContainer) return;
        
        console.log('✅ Videos section ready for CMS content');
    } catch (error) {
        console.log('⚠️ Could not load videos:', error.message);
    }
}

async function loadAwards() {
    try {
        const awardsContainer = document.getElementById('awardsList');
        if (!awardsContainer) return;
        
        // Load file list from manifest
        const manifestResponse = await fetch('./content/manifest.json');
        if (!manifestResponse.ok) {
            console.log('⚠️ Could not load content manifest');
            return;
        }
        
        const manifest = await manifestResponse.json();
        const awardFiles = manifest.awards || [];
        
        for (const filename of awardFiles) {
            try {
                const response = await fetch(`./content/awards/${filename}`);
                if (response.ok) {
                    const content = await response.text();
                    const data = parseMarkdownFrontmatter(content);
                    renderAwardItem(data, awardsContainer);
                }
            } catch (error) {
                console.log(`⚠️ Could not load ${filename}:`, error.message);
            }
        }
        
        console.log('✅ Awards loaded');
    } catch (error) {
        console.log('⚠️ Could not load awards:', error.message);
    }
}

// Render functions for different content types
function renderEducationItem(data, container) {
    const educationItem = document.createElement('div');
    educationItem.className = 'education-item';
    
    const startYear = data.startDate ? new Date(data.startDate).getFullYear() : '';
    const endYear = data.endDate ? new Date(data.endDate).getFullYear() : 'Present';
    
    educationItem.innerHTML = `
        <div class="education-date">${startYear} - ${endYear}</div>
        <div class="education-content">
            <h3>${data.degree || 'Degree'}</h3>
            <h4>${data.institution || 'Institution'}</h4>
            <p>${data.description || ''}</p>
        </div>
    `;
    
    container.appendChild(educationItem);
}

function renderSkillItem(data, container) {
    const skillItem = document.createElement('div');
    skillItem.className = 'skill-item';
    
    skillItem.innerHTML = `
        <div class="skill-info">
            <h3>${data.name || 'Skill'}</h3>
            <span class="skill-category">${data.category || ''}</span>
            <div class="skill-level">${data.proficiency || ''}</div>
        </div>
    `;
    
    container.appendChild(skillItem);
}

function renderProjectItem(data, container) {
    const projectItem = document.createElement('div');
    projectItem.className = 'project-card';
    
    const technologies = Array.isArray(data.technologies) ? data.technologies.join(', ') : (data.technologies || '');
    
    projectItem.innerHTML = `
        <div class="project-content">
            <h3>${data.title || 'Project'}</h3>
            <div class="project-description">${data.description || ''}</div>
            <div class="project-tech">${technologies}</div>
            <div class="project-links">
                ${data.url ? `<a href="${data.url}" target="_blank" class="btn btn-small">View Project</a>` : ''}
                ${data.github ? `<a href="${data.github}" target="_blank" class="btn btn-small">GitHub</a>` : ''}
            </div>
        </div>
    `;
    
    container.appendChild(projectItem);
}

function renderPublicationItem(data, container) {
    const pubItem = document.createElement('div');
    pubItem.className = 'publication-item';
    
    pubItem.innerHTML = `
        <div class="publication-content">
            <h3>${data.title || 'Publication'}</h3>
            <div class="publication-journal">${data.journal || ''}</div>
            <div class="publication-authors">${data.authors || ''}</div>
            <div class="publication-date">${data.date ? new Date(data.date).getFullYear() : ''}</div>
            <div class="publication-abstract">${data.abstract || ''}</div>
            ${data.url ? `<a href="${data.url}" target="_blank" class="btn btn-small">Read Publication</a>` : ''}
        </div>
    `;
    
    container.appendChild(pubItem);
}

function renderAwardItem(data, container) {
    const awardItem = document.createElement('div');
    awardItem.className = 'award-item';
    
    awardItem.innerHTML = `
        <div class="award-content">
            <h3>${data.title || 'Award'}</h3>
            <div class="award-organization">${data.organization || ''}</div>
            <div class="award-date">${data.date ? new Date(data.date).getFullYear() : ''}</div>
            <div class="award-category">${data.category || ''}</div>
            <div class="award-description">${data.description || ''}</div>
        </div>
    `;
    
    container.appendChild(awardItem);
}

// Load content when page loads
document.addEventListener('DOMContentLoaded', loadNetlifyCMSContent);

// Export for use in other scripts
window.loadNetlifyCMSContent = loadNetlifyCMSContent;
