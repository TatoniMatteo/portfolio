import './Career.css'
import Timeline from "../timeline/Timeline.tsx";

const Career = () => {
    return (
        <div className="section">
            <div className="section-title">
                <h1>Career</h1>
            </div>
            <div className="career-body">
                <Timeline/>
            </div>
        </div>
    )
}
export default Career;