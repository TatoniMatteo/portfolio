import ScrollEffects from "./components/scroll-effects/ScrollEffects";
import Navbar from "./components/navbar/Navbar.tsx";
import Hero from "./components/hero/Hero.tsx";
import About from "./components/about/About.tsx";
import Career from "./components/career/Career.tsx";
import Resume from "./components/resume/Resume.tsx";
import OpenSource from "./components/opensource/OpenSource.tsx";
import Project from "./components/project/Project.tsx";
import Contact from "./components/contact/Contact.tsx";
import Footer from "./components/footer/Footer.tsx";

const App = () => {
    return (
        <div>
            <ScrollEffects/>
            <Navbar/>
            <main id="main-content">
                <Hero/>
                <About/>
                <Career/>
                <Resume/>
                <OpenSource/>
                <Project/>
                <Contact/>
            </main>
            <Footer/>
        </div>
    );
};

export default App;
