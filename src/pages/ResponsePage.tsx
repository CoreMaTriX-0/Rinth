import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import ProjectImage from '../components/ProjectImage'
import ProjectDescription from '../components/ProjectDescription'
import TabsContainer from '../components/TabsContainer'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'

// Mock data - in real app, this would come from Gemini API
const mockProjectData = {
  title: "Smart Line Following Robot",
  description: "Build an intelligent robot that can follow a line path using infrared sensors and Arduino. This project combines basic electronics, programming, and mechanical assembly to create an autonomous robot that can navigate predefined tracks. Perfect for learning about sensor integration, motor control, and PID algorithms.",
  tags: ["Robotics", "Arduino", "IR Sensors", "Beginner Friendly"],
  imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop",
  instructions: [
    "Gather all the components listed in the Components tab. Make sure you have a clean workspace with good lighting.",
    "Assemble the robot chassis by attaching the two DC motors to the motor mounts. Secure them firmly using the provided screws.",
    "Attach the wheels to the motor shafts and mount the caster wheel at the front for balance.",
    "Mount the Arduino Uno on top of the chassis using standoffs to prevent short circuits.",
    "Connect the L298N motor driver module. Wire the motor outputs to the DC motors and connect the input pins to Arduino digital pins 5, 6, 9, and 10.",
    "Mount the IR sensor array at the front bottom of the robot, facing downward. Keep them about 1-2cm above the ground.",
    "Connect the IR sensors to Arduino analog pins A0-A4. Don't forget to connect VCC and GND.",
    "Upload the provided code to your Arduino using the Arduino IDE. Make sure to select the correct board and port.",
    "Calibrate the sensors by placing the robot on a white surface and then on the black line. Adjust the threshold values in the code accordingly.",
    "Test your robot on a simple track first, then gradually increase complexity. Fine-tune the PID values for smoother movement."
  ],
  components: [
    { name: "Arduino Uno R3", quantity: 1, description: "Main microcontroller board" },
    { name: "L298N Motor Driver", quantity: 1, description: "Dual H-bridge motor driver" },
    { name: "DC Geared Motors", quantity: 2, description: "3-6V DC motors with gear reduction" },
    { name: "Robot Wheels", quantity: 2, description: "65mm diameter rubber wheels" },
    { name: "Caster Wheel", quantity: 1, description: "Small ball caster for balance" },
    { name: "IR Sensor Module", quantity: 5, description: "TCRT5000 infrared sensors" },
    { name: "Robot Chassis", quantity: 1, description: "Acrylic or 3D printed base plate" },
    { name: "Battery Holder", quantity: 1, description: "4xAA battery holder" },
    { name: "Jumper Wires", quantity: 20, description: "Male-to-female and male-to-male" },
    { name: "USB Cable", quantity: 1, description: "Type A to Type B for programming" }
  ],
  code: [
    {
      language: "C++",
      filename: "line_follower.ino",
      code: `// Line Following Robot with PID Control
// For Arduino Uno

// Motor pins
#define ENA 5
#define IN1 6
#define IN2 7
#define IN3 8
#define IN4 9
#define ENB 10

// Sensor pins
#define S1 A0
#define S2 A1
#define S3 A2
#define S4 A3
#define S5 A4

// PID constants
float Kp = 25;
float Ki = 0;
float Kd = 15;

int baseSpeed = 150;
int maxSpeed = 255;

float error = 0;
float lastError = 0;
float integral = 0;

void setup() {
  // Motor pins as output
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  pinMode(ENB, OUTPUT);
  
  Serial.begin(9600);
}

void loop() {
  int s1 = analogRead(S1) > 500 ? 1 : 0;
  int s2 = analogRead(S2) > 500 ? 1 : 0;
  int s3 = analogRead(S3) > 500 ? 1 : 0;
  int s4 = analogRead(S4) > 500 ? 1 : 0;
  int s5 = analogRead(S5) > 500 ? 1 : 0;
  
  // Calculate position
  int position = s1*1 + s2*2 + s3*3 + s4*4 + s5*5;
  int sum = s1 + s2 + s3 + s4 + s5;
  
  if(sum > 0) {
    position = position / sum;
  }
  
  // PID calculation
  error = 3 - position;
  integral += error;
  float derivative = error - lastError;
  
  float correction = Kp*error + Ki*integral + Kd*derivative;
  
  int leftSpeed = baseSpeed + correction;
  int rightSpeed = baseSpeed - correction;
  
  leftSpeed = constrain(leftSpeed, 0, maxSpeed);
  rightSpeed = constrain(rightSpeed, 0, maxSpeed);
  
  moveMotors(leftSpeed, rightSpeed);
  
  lastError = error;
  delay(10);
}

void moveMotors(int left, int right) {
  // Left motor
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  analogWrite(ENA, left);
  
  // Right motor
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  analogWrite(ENB, right);
}`
    }
  ],
  buyLinks: [
    { component: "Arduino Uno R3", store: "Amazon", url: "https://amazon.com", price: "$12.99" },
    { component: "L298N Motor Driver", store: "Amazon", url: "https://amazon.com", price: "$6.99" },
    { component: "DC Motor Kit (2pcs + wheels)", store: "Amazon", url: "https://amazon.com", price: "$8.99" },
    { component: "IR Sensor Module (5pcs)", store: "Amazon", url: "https://amazon.com", price: "$7.49" },
    { component: "Robot Chassis Kit", store: "Amazon", url: "https://amazon.com", price: "$9.99" },
    { component: "Jumper Wire Kit", store: "Amazon", url: "https://amazon.com", price: "$5.99" },
    { component: "Complete Kit Bundle", store: "AliExpress", url: "https://aliexpress.com", price: "$24.99" }
  ]
}

const ResponsePage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [newPrompt, setNewPrompt] = useState('')
  const [isRefining, setIsRefining] = useState(false)
  const prompt = location.state?.prompt || "Build a line-following robot"

  const handleRefinePrompt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPrompt.trim()) return

    setIsRefining(true)
    
    // Simulate API call - in real app, this would call Gemini API with the refined prompt
    setTimeout(() => {
      // Navigate to response page with the new refined prompt
      navigate('/response', { state: { prompt: newPrompt } })
      setIsRefining(false)
      setNewPrompt('')
    }, 1500)
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - 2 * margin
    let yPos = margin

    // Colors matching the UI
    const colors = {
      dark: [26, 26, 26] as [number, number, number],
      darkLight: [45, 45, 45] as [number, number, number],
      primary: [245, 197, 24] as [number, number, number],
      white: [255, 255, 255] as [number, number, number],
      gray: [156, 163, 175] as [number, number, number],
      green: [34, 197, 94] as [number, number, number],
    }

    // Helper function to add new page if needed
    const checkNewPage = (height: number) => {
      if (yPos + height > pageHeight - margin) {
        doc.addPage()
        yPos = margin
        // Add background to new page
        doc.setFillColor(...colors.dark)
        doc.rect(0, 0, pageWidth, pageHeight, 'F')
      }
    }

    // Helper to draw section header
    const drawSectionHeader = (title: string) => {
      checkNewPage(25)
      doc.setFillColor(...colors.darkLight)
      doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F')
      doc.setFillColor(...colors.primary)
      doc.rect(margin, yPos, 4, 12, 'F')
      doc.setTextColor(...colors.primary)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(title, margin + 10, yPos + 8)
      yPos += 18
    }

    // Background
    doc.setFillColor(...colors.dark)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    // Header with logo placeholder
    doc.setFillColor(...colors.primary)
    doc.roundedRect(margin, yPos, 12, 12, 2, 2, 'F')
    doc.setTextColor(...colors.dark)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('⚡', margin + 3, yPos + 8)
    
    doc.setTextColor(...colors.white)
    doc.setFontSize(20)
    doc.text('Rinth', margin + 18, yPos + 10)
    
    doc.setTextColor(...colors.gray)
    doc.setFontSize(8)
    doc.text('AI Project Builder', margin + 48, yPos + 10)
    yPos += 25

    // Project Title
    doc.setTextColor(...colors.white)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(mockProjectData.title, contentWidth)
    doc.text(titleLines, margin, yPos)
    yPos += titleLines.length * 10 + 5

    // Tags
    let tagX = margin
    doc.setFontSize(8)
    mockProjectData.tags.forEach((tag) => {
      const tagWidth = doc.getTextWidth(tag) + 10
      if (tagX + tagWidth > pageWidth - margin) {
        tagX = margin
        yPos += 10
      }
      doc.setFillColor(...colors.darkLight)
      doc.roundedRect(tagX, yPos, tagWidth, 8, 2, 2, 'F')
      doc.setTextColor(...colors.primary)
      doc.text(tag, tagX + 5, yPos + 5.5)
      tagX += tagWidth + 5
    })
    yPos += 18

    // User Prompt Box
    doc.setFillColor(...colors.darkLight)
    doc.roundedRect(margin, yPos, contentWidth, 18, 3, 3, 'F')
    doc.setTextColor(...colors.gray)
    doc.setFontSize(8)
    doc.text('Your prompt:', margin + 5, yPos + 6)
    doc.setTextColor(...colors.white)
    doc.setFontSize(10)
    const promptText = doc.splitTextToSize(`"${prompt}"`, contentWidth - 10)
    doc.text(promptText[0], margin + 5, yPos + 13)
    yPos += 25

    // Description Section
    drawSectionHeader('📝 DESCRIPTION')
    doc.setTextColor(...colors.white)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const descLines = doc.splitTextToSize(mockProjectData.description, contentWidth - 10)
    descLines.forEach((line: string) => {
      checkNewPage(7)
      doc.text(line, margin + 5, yPos)
      yPos += 6
    })
    yPos += 10

    // Instructions Section
    drawSectionHeader('📋 INSTRUCTIONS')
    mockProjectData.instructions.forEach((instruction, index) => {
      checkNewPage(20)
      // Step number circle
      doc.setFillColor(...colors.primary)
      doc.circle(margin + 8, yPos + 3, 5, 'F')
      doc.setTextColor(...colors.dark)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}`, margin + 6, yPos + 5)
      
      // Instruction text
      doc.setTextColor(...colors.white)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const instrLines = doc.splitTextToSize(instruction, contentWidth - 25)
      instrLines.forEach((line: string, lineIndex: number) => {
        checkNewPage(6)
        doc.text(line, margin + 18, yPos + (lineIndex * 5))
      })
      yPos += Math.max(instrLines.length * 5, 8) + 5
    })
    yPos += 5

    // Components Section
    drawSectionHeader('🔧 COMPONENTS')
    // Table header
    doc.setFillColor(...colors.darkLight)
    doc.rect(margin, yPos, contentWidth, 8, 'F')
    doc.setTextColor(...colors.primary)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Component', margin + 5, yPos + 5.5)
    doc.text('Qty', margin + 80, yPos + 5.5)
    doc.text('Description', margin + 100, yPos + 5.5)
    yPos += 10

    // Table rows
    mockProjectData.components.forEach((comp, index) => {
      checkNewPage(10)
      if (index % 2 === 0) {
        doc.setFillColor(35, 35, 35)
        doc.rect(margin, yPos - 2, contentWidth, 8, 'F')
      }
      doc.setTextColor(...colors.white)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(comp.name.substring(0, 25), margin + 5, yPos + 4)
      doc.setTextColor(...colors.primary)
      doc.text(`x${comp.quantity}`, margin + 80, yPos + 4)
      doc.setTextColor(...colors.gray)
      doc.text(comp.description.substring(0, 35), margin + 100, yPos + 4)
      yPos += 8
    })
    yPos += 10

    // Code Section
    drawSectionHeader('💻 CODE')
    mockProjectData.code.forEach((codeBlock) => {
      checkNewPage(30)
      // Filename header
      doc.setFillColor(30, 30, 30)
      doc.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F')
      doc.setTextColor(...colors.green)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`📄 ${codeBlock.filename}`, margin + 5, yPos + 7)
      doc.setTextColor(...colors.gray)
      doc.text(codeBlock.language, pageWidth - margin - 20, yPos + 7)
      yPos += 12

      // Code content (first 30 lines)
      doc.setFillColor(20, 20, 20)
      const codeLines = codeBlock.code.split('\n').slice(0, 30)
      const codeHeight = Math.min(codeLines.length * 4 + 6, 80)
      checkNewPage(codeHeight)
      doc.roundedRect(margin, yPos, contentWidth, codeHeight, 2, 2, 'F')
      
      doc.setTextColor(...colors.gray)
      doc.setFontSize(6)
      doc.setFont('courier', 'normal')
      codeLines.forEach((line, i) => {
        if (yPos + (i * 4) + 4 < pageHeight - margin) {
          const truncatedLine = line.substring(0, 80)
          doc.text(truncatedLine, margin + 5, yPos + 4 + (i * 4))
        }
      })
      yPos += codeHeight + 10
    })

    // Footer
    checkNewPage(20)
    yPos = pageHeight - 15
    doc.setDrawColor(...colors.darkLight)
    doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5)
    doc.setTextColor(...colors.gray)
    doc.setFontSize(8)
    doc.text('Generated by Rinth - AI Project Builder', margin, yPos)
    doc.setTextColor(...colors.primary)
    doc.text(new Date().toLocaleDateString(), pageWidth - margin - 25, yPos)

    // Save the PDF
    doc.save(`${mockProjectData.title.replace(/\s+/g, '_')}_project.pdf`)
  }

  useEffect(() => {
    // Check current auth state
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      // If user is not logged in, show login prompt after loading
      if (!session?.user) {
        setShowLoginPrompt(true)
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setShowLoginPrompt(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex flex-col">
        <Header showBack user={user} />
        <main className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="loader mx-auto mb-6" />
            <h2 className="text-xl text-white mb-2">Generating your project...</h2>
            <p className="text-gray-500 max-w-md">
              Our AI is analyzing your request and creating detailed instructions, 
              component lists, and code for your project.
            </p>
            <div className="mt-6 bg-dark-light rounded-xl p-4 max-w-lg mx-auto border border-dark-lighter">
              <p className="text-gray-400 text-sm italic">"{prompt}"</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark">
      <Header showBack user={user} />
      
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Login Prompt Banner - Show only if not logged in */}
          {showLoginPrompt && !user && !isLoading && (
            <div className="mb-8 bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-2xl p-6 animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Save Your Project!</h3>
                  </div>
                  <p className="text-gray-300 mb-4">
                    Sign in to save this project, access it later, share with the community, and keep your build history.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate('/login', { state: { returnTo: location.pathname, prompt } })}
                      className="bg-primary text-dark px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-light transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In
                    </button>
                    <button
                      onClick={() => navigate('/signup')}
                      className="bg-dark-light border border-dark-lighter text-white px-6 py-2.5 rounded-lg font-semibold hover:border-primary/50 transition-colors"
                    >
                      Create Account
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* Top Action Bar */}
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>Your prompt:</span>
              <span className="text-white font-medium">"{prompt}"</span>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 bg-dark-light border border-dark-lighter text-white px-4 py-2 rounded-lg text-sm font-medium hover:border-primary/50 hover:text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </button>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Image and Description */}
            <div>
              <ProjectImage 
                imageUrl={mockProjectData.imageUrl} 
                projectName={mockProjectData.title} 
              />
              <ProjectDescription 
                title={mockProjectData.title}
                description={mockProjectData.description}
                tags={mockProjectData.tags}
              />
              
              {/* Action Buttons */}
              <div className="mt-6 flex gap-4 animate-slide-left" style={{ animationDelay: '0.2s' }}>
                <button 
                  onClick={handleDownloadPDF}
                  className="flex-1 bg-primary text-dark font-semibold py-3 px-6 rounded-xl hover:bg-primary-light transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </button>
                <Link 
                  to="/community"
                  className="flex-1 bg-dark-light border border-dark-lighter text-white font-semibold py-3 px-6 rounded-xl hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Share to Community
                </Link>
              </div>
            </div>

            {/* Right Side - Tabs */}
            <div>
              <TabsContainer 
                instructions={mockProjectData.instructions}
                components={mockProjectData.components}
                code={mockProjectData.code}
                buyLinks={mockProjectData.buyLinks}
              />
              
              {/* Refine Prompt Section */}
              <div className="mt-8 animate-fade-in">
                <form onSubmit={handleRefinePrompt} className="relative">
                  <textarea
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    placeholder={`Type a refined version of your prompt here...`}
                    className="w-full bg-dark-light text-white rounded-xl px-4 py-3 pr-14 border border-dark-lighter focus:border-primary focus:outline-none resize-none transition-colors"
                    rows={3}
                    disabled={isRefining}
                  />
                  
                  <button
                    type="submit"
                    disabled={!newPrompt.trim() || isRefining}
                    className="absolute bottom-3 right-3 bg-primary text-dark p-2.5 rounded-lg hover:bg-primary-light transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isRefining ? (
                      <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                </form>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setNewPrompt(`${prompt} with wireless connectivity`)}
                    className="text-xs bg-dark-light px-3 py-1.5 rounded-lg text-gray-400 hover:text-primary hover:border-primary/50 border border-dark-lighter transition-colors"
                  >
                    + Wireless
                  </button>
                  <button
                    onClick={() => setNewPrompt(`${prompt} for beginners`)}
                    className="text-xs bg-dark-light px-3 py-1.5 rounded-lg text-gray-400 hover:text-primary hover:border-primary/50 border border-dark-lighter transition-colors"
                  >
                    + Easier
                  </button>
                  <button
                    onClick={() => setNewPrompt(`${prompt} with advanced features`)}
                    className="text-xs bg-dark-light px-3 py-1.5 rounded-lg text-gray-400 hover:text-primary hover:border-primary/50 border border-dark-lighter transition-colors"
                  >
                    + Advanced
                  </button>
                  <button
                    onClick={() => setNewPrompt(`${prompt} on a budget`)}
                    className="text-xs bg-dark-light px-3 py-1.5 rounded-lg text-gray-400 hover:text-primary hover:border-primary/50 border border-dark-lighter transition-colors"
                  >
                    + Budget
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ResponsePage
