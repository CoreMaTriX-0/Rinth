interface ProjectDescriptionProps {
  title: string
  description: string
  tags?: string[]
}

const ProjectDescription: React.FC<ProjectDescriptionProps> = ({ 
  title, 
  description, 
  tags = ['Robotics', 'Arduino', 'Beginner'] 
}) => {
  return (
    <div className="mt-6 animate-slide-left" style={{ animationDelay: '0.1s' }}>
      <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, index) => (
          <span 
            key={index}
            className="px-3 py-1 bg-dark-lighter rounded-full text-xs text-primary font-medium"
          >
            {tag}
          </span>
        ))}
      </div>
      
      <p className="text-gray-400 leading-relaxed text-sm">
        {description}
      </p>
      
      <div className="mt-6 flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>~2-3 hours</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>~$25-40</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Intermediate</span>
        </div>
      </div>
    </div>
  )
}

export default ProjectDescription
