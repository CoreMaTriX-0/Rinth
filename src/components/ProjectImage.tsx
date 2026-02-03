interface ProjectImageProps {
  imageUrl?: string
  projectName: string
}

const ProjectImage: React.FC<ProjectImageProps> = ({ imageUrl, projectName }) => {
  // Placeholder image for demo - in real app, this would be AI-generated
  const placeholderUrl = imageUrl || "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop"

  return (
    <div className="relative group animate-slide-left">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
      <div className="relative overflow-hidden rounded-2xl border border-dark-lighter">
        <img
          src={placeholderUrl}
          alt={projectName}
          className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/90 rounded-full text-dark text-xs font-semibold">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            AI Generated
          </span>
        </div>
      </div>
    </div>
  )
}

export default ProjectImage
