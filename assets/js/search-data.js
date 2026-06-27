// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-projects",
          title: "projects",
          description: "A growing collection of your cool projects.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "nav-repositories",
          title: "repositories",
          description: "Edit the `_data/repositories.yml` and change the `github_users` and `github_repos` lists to include your own GitHub profile and repositories.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/repositories/";
          },
        },{id: "nav-cv",
          title: "cv",
          description: "This is a description of the page. You can modify it in &#39;_pages/cv.md&#39;. You can also change or remove the top pdf download button.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "post-what-i-m-learning-from-the-4-hour-workweek-and-why-it-s-blowing-my-mind",
        
          title: "What I’m Learning from The 4-Hour Workweek (And Why It’s Blowing My Mind)...",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/what-im-learning-from-the-4-hour-workweek-and-why-its-blowing-my-mind/";
          
        },
      },{id: "post-how-to-make-your-smartphone-disappear-a-deep-dive-into-mobile-privacy",
        
          title: "How to Make Your Smartphone Disappear: A Deep Dive into Mobile Privacy",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/how-to-make-your-smartphone-disappear-a-deep-dive-into-mobile-privacy/";
          
        },
      },{id: "post-archetype-hackthebox-walkthrough",
        
          title: "Archetype — HackTheBox Walkthrough",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/archetype-hackthebox-walkthrough/";
          
        },
      },{id: "books-the-godfather",
          title: 'The Godfather',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_godfather/";
            },},{id: "news-portfolio-site-live-weekly-updates-from-here",
          title: 'Portfolio site live — weekly updates from here',
          description: "",
          section: "News",handler: () => {
              window.location.href = "/news/announcement_3/";
            },},{id: "news-p1-sast-dast-triage-tool-shipped-and-pushed-to-github",
          title: 'P1 SAST+DAST Triage Tool shipped and pushed to GitHub',
          description: "",
          section: "News",handler: () => {
              window.location.href = "/news/announcement_1/";
            },},{id: "news-p3-ai-log-anomaly-detector-mitre-att-amp-ck-mapping-abuseipdb-email-alerts",
          title: 'P3 AI Log Anomaly Detector — MITRE ATT&amp;amp;CK mapping, AbuseIPDB, email alerts',
          description: "",
          section: "News",handler: () => {
              window.location.href = "/news/announcement_2/";
            },},{id: "projects-p1-sast-dast-triage-tool",
          title: 'P1 — SAST+DAST Triage Tool',
          description: "Deduplicates Semgrep/Bandit/ZAP findings, CWE-based risk scoring, LLM false-positive filter, SARIF 2.1.0 export",
          section: "Projects",handler: () => {
              window.location.href = "/projects/1_project/";
            },},{id: "projects-p3-ai-log-anomaly-detector",
          title: 'P3 — AI Log Anomaly Detector',
          description: "Auth log analysis with MITRE ATT&amp;CK mapping, AbuseIPDB enrichment, confidence scores, email alerts",
          section: "Projects",handler: () => {
              window.location.href = "/projects/2_project/";
            },},{id: "projects-ctf-lab",
          title: 'CTF Lab',
          description: "HackTheBox &amp; TryHackMe writeups, custom exploit scripts, weekly practice",
          section: "Projects",handler: () => {
              window.location.href = "/projects/3_project/";
            },},{id: "projects-memory-safety-lab",
          title: 'Memory Safety Lab',
          description: "Hands-on C exploitation — buffer overflows, heap corruption, use-after-free",
          section: "Projects",handler: () => {
              window.location.href = "/projects/4_project/";
            },},{id: "projects-offsec-saturdays",
          title: 'Offsec Saturdays',
          description: "Weekly offensive security study notes — tools, techniques, labs, methodology",
          section: "Projects",handler: () => {
              window.location.href = "/projects/5_project/";
            },},{id: "projects-75-hard-tracker",
          title: '75 Hard Tracker',
          description: "Flask web app for tracking 75 Hard challenge — daily check-ins, weight log, streak counter",
          section: "Projects",handler: () => {
              window.location.href = "/projects/6_project/";
            },},{id: "projects-coming-soon",
          title: 'Coming Soon',
          description: "Project in development",
          section: "Projects",handler: () => {
              window.location.href = "/projects/7_project/";
            },},{id: "projects-coming-soon",
          title: 'Coming Soon',
          description: "Project in development",
          section: "Projects",handler: () => {
              window.location.href = "/projects/8_project/";
            },},{id: "projects-coming-soon",
          title: 'Coming Soon',
          description: "Project in development",
          section: "Projects",handler: () => {
              window.location.href = "/projects/9_project/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%63%6C%61%75%64%65.%61%69.%74%72%65%61%73%6F%6E%39%37%37@%70%61%73%73%6D%61%69%6C.%6E%65%74", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/PyHackSecGP", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/gurpreet-singh-cyber", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
