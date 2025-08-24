import {useEffect} from "react";
import Navbar from "./components/navbar/Navbar.tsx";
import Hero from "./components/hero/Hero.tsx";
import About from "./components/about/About.tsx";
import Career from "./components/career/Career.tsx";
import Project from "./components/project/Project.tsx";
import Contact from "./components/contact/Contact.tsx";
import Footer from "./components/footer/Footer.tsx";

const App = () => {
    useEffect(() => {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    }, []);

    return (
        <div>
            <Navbar/>
            <Hero/>
            <About/>
            <Career/>
            <Project/>
            <Contact/>
            <Footer/>
        </div>
    );
};

export default App;
