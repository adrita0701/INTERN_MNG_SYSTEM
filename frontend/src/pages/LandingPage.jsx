import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ChevronLeft, ChevronRight, Mail, Phone, MapPin, Send, Shield, Users, BookOpen, ArrowRight, Sparkles, User } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true);
  const [fadeLoader, setFadeLoader] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signupDropdownOpen, setSignupDropdownOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Dynamic initial page loading screen (smooth splash effect)
  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeLoader(true);
      setTimeout(() => setPageLoading(false), 600);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Carousel images provided by Datayug Society
  const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const carouselImages = [
    {
      src: `${baseUrl}images/carousel1.jpg`,
      title: 'Digital Literacy & Awareness',
      tag: 'Workshops & Seminars',
      desc: 'Conducting digital awareness drives in Meghalaya to bridge the digital divide and foster cyber safety.'
    },
    {
      src: `${baseUrl}images/carousel2.jpg`,
      title: 'Community Outreach Programs',
      tag: 'Hands-on Training',
      desc: 'Interactive registration and technology booths engaging students, families, and future young leaders.'
    },
    {
      src: `${baseUrl}images/carousel3.jpg`,
      title: 'Leadership & Student Mentorship',
      tag: 'Team Collaboration',
      desc: 'Dedicated leadership teams and student delegates collaborating on educational tech and social impact.'
    },
    {
      src: `${baseUrl}images/carousel4.jpg`,
      title: 'School Digital Literacy Drives',
      tag: 'Education Drives',
      desc: 'Empowering young school students across institutions with foundational computing and digital safety skills.'
    }
  ];

  // Auto slide effect every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [carouselImages.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContactForm({ name: '', email: '', message: '' });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-mesh-gradient text-slate-100 flex flex-col font-sans relative">
      
      {/* =========================================================
          DYNAMIC PAGE LOADER / SPLASH SCREEN
          ========================================================= */}
      {pageLoading && (
        <div 
          className={`fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-600 ${
            fadeLoader ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="relative flex flex-col items-center text-center px-4">
            {/* Ambient Background Glow */}
            <div className="absolute -inset-10 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
            
            {/* Logo Container with glassmorphism & gentle float */}
            <div className="relative w-24 h-24 rounded-3xl glass border border-blue-500/30 flex items-center justify-center p-3 shadow-2xl mb-6 animate-bounce">
              <img src={`${baseUrl}images/logo.png`} alt="Datayug Society Logo" className="w-full h-full object-contain" />
            </div>

            {/* Brand Title */}
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-1">
              Datayug Society
            </h2>
            <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-8">
              Internship Management System
            </p>

            {/* Dynamic Progress Bar */}
            <div className="w-56 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full w-full animate-[shimmer_1.2s_infinite]" />
            </div>
            <span className="text-[11px] text-slate-500 mt-3 font-medium">Initializing workspace...</span>
          </div>
        </div>
      )}

      {/* =========================================================
          TOP NAVIGATION BAR (WITH VISIBLE ADMIN & INTERN BUTTONS)
          ========================================================= */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src={`${baseUrl}images/logo.png`} 
              alt="Datayug Society Logo" 
              className="h-11 w-auto object-contain rounded-md bg-white/10 p-1"
            />
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Datayug Society
              </span>
              <span className="block text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Internship System
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links & Action Buttons */}
          <div className="hidden lg:flex items-center space-x-6">
            <a href="#home" className="text-slate-300 hover:text-blue-400 transition-colors font-medium text-sm">Home</a>
            <a href="#about" className="text-slate-300 hover:text-blue-400 transition-colors font-medium text-sm">About</a>
            <a href="#contact" className="text-slate-300 hover:text-blue-400 transition-colors font-medium text-sm">Contact Us</a>

            <div className="h-5 w-px bg-slate-800" />

            {/* Direct Admin Login Button */}
            <button 
              onClick={() => navigate('/admin/auth?mode=login')}
              className="px-3.5 py-2 rounded-xl glass border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 text-amber-300 transition-all font-semibold text-xs flex items-center space-x-1.5 shadow-sm"
              title="Admin Portal"
            >
              <Shield size={14} className="text-amber-400" />
              <span>Admin Login</span>
            </button>

            {/* Direct Intern Login Button */}
            <button 
              onClick={() => navigate('/intern/auth?mode=login')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md hover:shadow-blue-500/25 transition-all flex items-center space-x-1.5"
            >
              <User size={14} />
              <span>Intern Login</span>
            </button>

            {/* Signup Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setSignupDropdownOpen(!signupDropdownOpen)}
                className="px-3.5 py-2 rounded-xl glass border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold text-xs transition-all flex items-center space-x-1"
              >
                <span>Sign Up</span>
              </button>
              {signupDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl glass p-2 shadow-2xl border border-slate-800">
                  <button 
                    onClick={() => { navigate('/intern/auth?mode=signup'); setSignupDropdownOpen(false); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-blue-600/20 hover:text-blue-400 rounded-lg text-xs transition-all font-medium"
                  >
                    Intern Registration
                  </button>
                  <button 
                    onClick={() => { navigate('/admin/auth?mode=signup'); setSignupDropdownOpen(false); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-amber-600/20 hover:text-amber-300 rounded-lg text-xs transition-all text-slate-400"
                  >
                    Admin Registration
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center space-x-2">
            <button 
              onClick={() => navigate('/admin/auth?mode=login')}
              className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 text-amber-300 text-xs font-semibold"
            >
              Admin
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-300 hover:text-white p-1.5"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden glass border-t border-slate-800 px-6 py-4 flex flex-col space-y-4">
            <a href="#home" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-400 transition-colors font-medium">Home</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-400 transition-colors font-medium">About</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-400 transition-colors font-medium">Contact Us</a>
            
            <div className="h-px bg-slate-800 w-full" />
            
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => { navigate('/admin/auth?mode=login'); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 font-semibold text-sm flex items-center space-x-2"
              >
                <Shield size={16} />
                <span>Admin Login</span>
              </button>
              <button 
                onClick={() => { navigate('/intern/auth?mode=login'); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm flex items-center space-x-2"
              >
                <User size={16} />
                <span>Intern Login</span>
              </button>
              <button 
                onClick={() => { navigate('/intern/auth?mode=signup'); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
              >
                Create Intern Account
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* =========================================================
          HERO SECTION: SIDE-BY-SIDE WITH FULL CAROUSEL ON FIRST SCREEN
          (Zero task lists shown on this public page)
          ========================================================= */}
      <section id="home" className="pt-28 lg:pt-32 pb-16 px-4 sm:px-6 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center">
        
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Welcome Details & Explicit Portals */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={13} />
              <span>Official Internship Portal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Nurturing Talents,<br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Empowering Digital Futures
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Datayug Society is a registered NGO promoting digital awareness across India. This platform provides interns a structured workflow to report contributions, upload proof of work, and track milestones.
            </p>

            {/* Direct Login Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button 
                onClick={() => navigate('/admin/auth?mode=login')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-sm shadow-lg shadow-amber-500/5 transition-all flex items-center justify-center space-x-2"
              >
                <Shield size={16} className="text-amber-400" />
                <span>Admin Login</span>
              </button>

              <button 
                onClick={() => navigate('/intern/auth?mode=login')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
              >
                <User size={16} />
                <span>Intern Login</span>
              </button>

              <button 
                onClick={() => navigate('/intern/auth?mode=signup')}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl glass border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold text-xs transition-all text-center"
              >
                Register
              </button>
            </div>
          </div>

          {/* Right Column: Full-Height Dynamic Photo Carousel (No Small Gallery Below) */}
          <div className="lg:col-span-7 w-full flex flex-col">
            
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-3xl overflow-hidden glass shadow-2xl border border-slate-800/90 group">
              
              {/* Active Carousel Image with Smooth Transition */}
              <img 
                key={currentSlide}
                src={carouselImages[currentSlide].src} 
                alt={carouselImages[currentSlide].title} 
                className="w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-105 animate-fade-in"
              />
              
              {/* Gradient Scrim for Text Legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent flex flex-col justify-end p-6 sm:p-8" />

              {/* Slide Details Overlay */}
              <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8 z-10">
                <span className="px-3 py-1 rounded-full bg-blue-600/90 text-[10px] font-bold text-white uppercase tracking-wider">
                  {carouselImages[currentSlide].tag}
                </span>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2 text-white leading-tight">
                  {carouselImages[currentSlide].title}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-xl leading-relaxed">
                  {carouselImages[currentSlide].desc}
                </p>
              </div>

              {/* Slide Navigation Arrows */}
              <button 
                onClick={prevSlide}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full glass border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-900/90 transition-all z-20 shadow-lg"
                aria-label="Previous slide"
              >
                <ChevronLeft size={22} />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full glass border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-900/90 transition-all z-20 shadow-lg"
                aria-label="Next slide"
              >
                <ChevronRight size={22} />
              </button>

              {/* Dynamic Slide Timer Bar (Re-runs every slide change) */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900/80 z-30 overflow-hidden">
                <div 
                  key={currentSlide}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-[4200ms] ease-linear w-full"
                  style={{
                    animation: 'timerBar 4.2s linear infinite'
                  }}
                />
              </div>

              {/* Modern Slide Indicator Dots */}
              <div className="absolute top-5 right-5 flex items-center space-x-1.5 z-20 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800">
                {carouselImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Slide ${index + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentSlide === index ? 'w-6 bg-blue-400' : 'w-1.5 bg-slate-600 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =========================================================
          ABOUT SECTION
          ========================================================= */}
      <section id="about" className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl font-extrabold tracking-tight">About The Portal</h2>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            Learn what the Internship Management System is, its purpose, and the benefits it offers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          <div className="glass-card rounded-2xl p-8 border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-5">
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">What is it?</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              The Internship Management System is a streamlined MVP for Datayug Society to coordinate projects, deadline tracking, and task completion proof.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-5">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Our Purpose</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              To provide transparent accountability. Administrators assign tasks with deadlines, and interns upload verified screenshots/images directly as verifiable proof.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Key Benefits</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Interns receive organized requirements and instant image preview capabilities. Administrators get unified overview metrics and proof galleries.
            </p>
          </div>

        </div>
      </section>

      {/* =========================================================
          CONTACT SECTION
          ========================================================= */}
      <section id="contact" className="py-20 bg-slate-950/40 relative border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight">Contact Us</h2>
            <p className="text-slate-400 leading-relaxed text-sm sm:text-base">
              Reach out to Datayug Society for questions regarding ongoing internships, technical assistance, or NGO partnerships.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-lg glass border border-slate-800 flex items-center justify-center text-blue-400">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium">contact@datayugsociety.org</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-lg glass border border-slate-800 flex items-center justify-center text-indigo-400">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="text-sm font-medium">+91 364 250 4452</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-lg glass border border-slate-800 flex items-center justify-center text-purple-400">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Address</p>
                  <p className="text-sm font-medium">Shillong, Meghalaya, India</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-8 border border-slate-800/80">
            {submitted ? (
              <div className="h-64 flex flex-col justify-center items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
                  <Send size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">Message Sent!</h3>
                <p className="text-slate-400 text-sm">Thank you for reaching out. We will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Name</label>
                  <input 
                    type="text" 
                    id="contact-name" 
                    required 
                    value={contactForm.name} 
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full glass-input text-sm"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                  <input 
                    type="email" 
                    id="contact-email" 
                    required 
                    value={contactForm.email} 
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full glass-input text-sm"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Message</label>
                  <textarea 
                    id="contact-message" 
                    required 
                    rows={4}
                    value={contactForm.message} 
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full glass-input text-sm resize-none"
                    placeholder="Type your message..."
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center space-x-2"
                >
                  <span>Send Message</span>
                  <Send size={15} />
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* =========================================================
          FOOTER
          ========================================================= */}
      <footer className="bg-slate-950 border-t border-slate-900 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <img src={`${baseUrl}images/logo.png`} alt="Logo" className="h-7 w-auto bg-white/10 p-1 rounded" />
            <span className="text-sm font-bold text-slate-300">Datayug Society</span>
          </div>
          <p className="text-xs text-slate-500 text-center">
            &copy; {new Date().getFullYear()} Datayug Society. All rights reserved. Registered NGO in Meghalaya.
          </p>
          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <button onClick={() => navigate('/admin/auth?mode=login')} className="hover:text-amber-300 transition-colors">Admin Portal</button>
            <span>•</span>
            <button onClick={() => navigate('/intern/auth?mode=login')} className="hover:text-blue-400 transition-colors">Intern Portal</button>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
