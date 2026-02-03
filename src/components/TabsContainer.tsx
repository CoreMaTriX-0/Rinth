import { useState } from 'react'

type TabType = 'instructions' | 'components' | 'code' | 'buylinks'

interface TabsContainerProps {
  instructions: string[]
  components: Component[]
  code: CodeBlock[]
  buyLinks: BuyLink[]
}

interface Component {
  name: string
  quantity: number
  description: string
}

interface CodeBlock {
  language: string
  filename: string
  code: string
}

interface BuyLink {
  component: string
  store: string
  url: string
  price: string
}

const TabsContainer: React.FC<TabsContainerProps> = ({
  instructions,
  components,
  code,
  buyLinks
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('instructions')

  const tabs = [
    { id: 'instructions' as TabType, label: 'Instructions', icon: '📋' },
    { id: 'components' as TabType, label: 'Components', icon: '🔧' },
    { id: 'code' as TabType, label: 'Code', icon: '💻' },
    { id: 'buylinks' as TabType, label: 'Buy Links', icon: '🛒' },
  ]

  return (
    <div className="bg-dark-light rounded-2xl border border-dark-lighter overflow-hidden animate-slide-right">
      {/* Tab Headers */}
      <div className="flex border-b border-dark-lighter">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-4 text-sm font-medium transition-all relative ${
              activeTab === tab.id
                ? 'text-primary'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6 max-h-[500px] overflow-y-auto">
        {activeTab === 'instructions' && (
          <InstructionsTab instructions={instructions} />
        )}
        {activeTab === 'components' && (
          <ComponentsTab components={components} />
        )}
        {activeTab === 'code' && (
          <CodeTab codeBlocks={code} />
        )}
        {activeTab === 'buylinks' && (
          <BuyLinksTab links={buyLinks} />
        )}
      </div>
    </div>
  )
}

// Instructions Tab
const InstructionsTab: React.FC<{ instructions: string[] }> = ({ instructions }) => (
  <div className="tab-content space-y-4">
    {instructions.map((instruction, index) => (
      <div key={index} className="flex gap-4 items-start">
        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-bold text-sm">{index + 1}</span>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed pt-1">{instruction}</p>
      </div>
    ))}
  </div>
)

// Components Tab
const ComponentsTab: React.FC<{ components: Component[] }> = ({ components }) => (
  <div className="tab-content space-y-3">
    {components.map((component, index) => (
      <div 
        key={index} 
        className="flex items-center justify-between p-4 bg-dark rounded-xl border border-dark-lighter hover:border-primary/30 transition-colors"
      >
        <div className="flex-1">
          <h4 className="text-white font-medium">{component.name}</h4>
          <p className="text-gray-500 text-sm mt-1">{component.description}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className="text-primary font-bold">×{component.quantity}</span>
        </div>
      </div>
    ))}
  </div>
)

// Code Tab
const CodeTab: React.FC<{ codeBlocks: CodeBlock[] }> = ({ codeBlocks }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="tab-content space-y-4">
      {codeBlocks.map((block, index) => (
        <div key={index} className="rounded-xl overflow-hidden border border-dark-lighter">
          <div className="flex items-center justify-between px-4 py-2 bg-dark-lighter">
            <div className="flex items-center gap-2">
              <span className="text-primary text-sm font-medium">{block.filename}</span>
              <span className="text-gray-600 text-xs">({block.language})</span>
            </div>
            <button
              onClick={() => copyToClipboard(block.code, index)}
              className="text-gray-500 hover:text-primary transition-colors"
            >
              {copiedIndex === index ? (
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
          <pre className="p-4 bg-dark overflow-x-auto">
            <code className="text-sm text-gray-300 font-mono">{block.code}</code>
          </pre>
        </div>
      ))}
    </div>
  )
}

// Buy Links Tab
const BuyLinksTab: React.FC<{ links: BuyLink[] }> = ({ links }) => (
  <div className="tab-content space-y-3">
    {links.map((link, index) => (
      <a
        key={index}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-4 bg-dark rounded-xl border border-dark-lighter hover:border-primary/50 transition-all group"
      >
        <div>
          <h4 className="text-white font-medium group-hover:text-primary transition-colors">
            {link.component}
          </h4>
          <p className="text-gray-500 text-sm mt-1">{link.store}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-primary font-bold">{link.price}</span>
          <svg className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </a>
    ))}
  </div>
)

export default TabsContainer
