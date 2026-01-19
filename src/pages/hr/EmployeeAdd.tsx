import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HRLayout from "@/components/hr/HRLayout";
import { useHRData, Employee } from "@/hooks/useHRData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronRight } from "lucide-react";

type FormData = Omit<Employee, "id" | "createdAt" | "leaveBalance">;

const initialFormData: FormData = {
  name: "",
  photo: "",
  address: "",
  phone: "",
  email: "",
  aadhaarNumber: "",
  panNumber: "",
  bloodGroup: "",
  fatherName: "",
  fatherMobile: "",
  motherName: "",
  motherMobile: "",
  highestEducation: "",
  degreeName: "",
  specialization: "",
  schoolCollege: "",
  boardUniversity: "",
  yearOfPassing: "",
  passedOrAppearing: "passed",
  marksPercentage: "",
  certifications: "",
  isFresher: true,
  organizationName: "",
  postHeld: "",
  jobPeriodFrom: "",
  jobPeriodTo: "",
  reasonOfLeaving: "",
  previousCTC: "",
  totalExperience: "",
  dateOfJoining: "",
  designation: "",
  additionalCharge: "",
  responsibilities: "",
  username: "",
  password: "",
};

const steps = [
  { id: 1, title: "Basic Information" },
  { id: 2, title: "Educational Information" },
  { id: 3, title: "Experience Information" },
  { id: 4, title: "For Office Use" },
];

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const educationLevels = ["High School", "Diploma", "Degree", "Masters", "PhD"];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => (currentYear - i).toString());

const EmployeeAdd = () => {
  const navigate = useNavigate();
  const { addEmployee } = useHRData();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange("photo", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.phone && formData.email && formData.address);
      case 2:
        return !!(formData.highestEducation && formData.degreeName);
      case 3:
        return formData.isFresher || !!(formData.organizationName && formData.postHeld);
      case 4:
        return !!(formData.dateOfJoining && formData.designation && formData.username && formData.password);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (!validateStep(4)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    addEmployee(formData);
    toast({
      title: "Employee Added",
      description: `${formData.name} has been successfully added to the system.`,
    });
    navigate("/hr/dashboard");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Employee Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Photo</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
                {formData.photo && (
                  <img src={formData.photo} alt="Preview" className="w-20 h-20 object-cover rounded-lg mt-2" />
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter full address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email ID *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhaar">Aadhaar Card Number</Label>
                <Input
                  id="aadhaar"
                  value={formData.aadhaarNumber}
                  onChange={(e) => handleInputChange("aadhaarNumber", e.target.value)}
                  placeholder="Enter Aadhaar number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pan">PAN Card Number</Label>
                <Input
                  id="pan"
                  value={formData.panNumber}
                  onChange={(e) => handleInputChange("panNumber", e.target.value)}
                  placeholder="Enter PAN number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blood">Blood Group</Label>
                <Select value={formData.bloodGroup} onValueChange={(v) => handleInputChange("bloodGroup", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodGroups.map(bg => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-medium text-foreground mb-4">Family Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fatherName">Father's Name</Label>
                  <Input
                    id="fatherName"
                    value={formData.fatherName}
                    onChange={(e) => handleInputChange("fatherName", e.target.value)}
                    placeholder="Enter father's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fatherMobile">Father's Mobile Number</Label>
                  <Input
                    id="fatherMobile"
                    value={formData.fatherMobile}
                    onChange={(e) => handleInputChange("fatherMobile", e.target.value)}
                    placeholder="Enter mobile number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherName">Mother's Name</Label>
                  <Input
                    id="motherName"
                    value={formData.motherName}
                    onChange={(e) => handleInputChange("motherName", e.target.value)}
                    placeholder="Enter mother's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherMobile">Mother's Mobile Number</Label>
                  <Input
                    id="motherMobile"
                    value={formData.motherMobile}
                    onChange={(e) => handleInputChange("motherMobile", e.target.value)}
                    placeholder="Enter mobile number"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground">Educational Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Highest Education *</Label>
                <Select value={formData.highestEducation} onValueChange={(v) => handleInputChange("highestEducation", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="degreeName">Name of Degree *</Label>
                <Input
                  id="degreeName"
                  value={formData.degreeName}
                  onChange={(e) => handleInputChange("degreeName", e.target.value)}
                  placeholder="e.g., MBA, B.Com, BE"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => handleInputChange("specialization", e.target.value)}
                  placeholder="e.g., Marketing, Finance"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolCollege">Name of School/College</Label>
                <Input
                  id="schoolCollege"
                  value={formData.schoolCollege}
                  onChange={(e) => handleInputChange("schoolCollege", e.target.value)}
                  placeholder="Enter institution name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="boardUniversity">Name of Board/University</Label>
                <Input
                  id="boardUniversity"
                  value={formData.boardUniversity}
                  onChange={(e) => handleInputChange("boardUniversity", e.target.value)}
                  placeholder="Enter board/university name"
                />
              </div>

              <div className="space-y-2">
                <Label>Year of Passing</Label>
                <Select value={formData.yearOfPassing} onValueChange={(v) => handleInputChange("yearOfPassing", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 md:col-span-2">
                <Label>Status</Label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="passedOrAppearing"
                      checked={formData.passedOrAppearing === "passed"}
                      onChange={() => handleInputChange("passedOrAppearing", "passed")}
                      className="w-4 h-4 text-primary"
                    />
                    <span>Passed</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="passedOrAppearing"
                      checked={formData.passedOrAppearing === "appearing"}
                      onChange={() => handleInputChange("passedOrAppearing", "appearing")}
                      className="w-4 h-4 text-primary"
                    />
                    <span>Appearing</span>
                  </label>
                </div>
              </div>

              {formData.passedOrAppearing === "passed" && (
                <div className="space-y-2">
                  <Label htmlFor="marks">Marks/Percentage/CGPA</Label>
                  <Input
                    id="marks"
                    value={formData.marksPercentage}
                    onChange={(e) => handleInputChange("marksPercentage", e.target.value)}
                    placeholder="Enter marks or percentage"
                  />
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="certifications">Certifications</Label>
                <Textarea
                  id="certifications"
                  value={formData.certifications}
                  onChange={(e) => handleInputChange("certifications", e.target.value)}
                  placeholder="Enter additional qualifications or certifications"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground">Experience Information</h3>
            
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <Checkbox
                id="isFresher"
                checked={formData.isFresher}
                onCheckedChange={(checked) => handleInputChange("isFresher", checked as boolean)}
              />
              <Label htmlFor="isFresher" className="cursor-pointer">
                I am a Fresher (No prior work experience)
              </Label>
            </div>

            {!formData.isFresher && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name *</Label>
                  <Input
                    id="orgName"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange("organizationName", e.target.value)}
                    placeholder="Enter previous organization"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postHeld">Post Held *</Label>
                  <Input
                    id="postHeld"
                    value={formData.postHeld}
                    onChange={(e) => handleInputChange("postHeld", e.target.value)}
                    placeholder="Enter your designation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobFrom">Job Period From</Label>
                  <Input
                    id="jobFrom"
                    type="date"
                    value={formData.jobPeriodFrom}
                    onChange={(e) => handleInputChange("jobPeriodFrom", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTo">Job Period To</Label>
                  <Input
                    id="jobTo"
                    type="date"
                    value={formData.jobPeriodTo}
                    onChange={(e) => handleInputChange("jobPeriodTo", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reasonLeaving">Reason of Leaving</Label>
                  <Input
                    id="reasonLeaving"
                    value={formData.reasonOfLeaving}
                    onChange={(e) => handleInputChange("reasonOfLeaving", e.target.value)}
                    placeholder="Enter reason"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousCTC">Previous CTC</Label>
                  <Input
                    id="previousCTC"
                    value={formData.previousCTC}
                    onChange={(e) => handleInputChange("previousCTC", e.target.value)}
                    placeholder="Enter previous CTC"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalExp">Total Years of Experience</Label>
                  <Input
                    id="totalExp"
                    value={formData.totalExperience}
                    onChange={(e) => handleInputChange("totalExperience", e.target.value)}
                    placeholder="e.g., 3 years"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground">For Office Use</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="doj">Date of Joining *</Label>
                <Input
                  id="doj"
                  type="date"
                  value={formData.dateOfJoining}
                  onChange={(e) => handleInputChange("dateOfJoining", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">Designation *</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => handleInputChange("designation", e.target.value)}
                  placeholder="Enter designation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalCharge">Additional Charge</Label>
                <Input
                  id="additionalCharge"
                  value={formData.additionalCharge}
                  onChange={(e) => handleInputChange("additionalCharge", e.target.value)}
                  placeholder="Enter additional responsibilities"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="responsibilities">Description of Responsibilities</Label>
                <Textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => handleInputChange("responsibilities", e.target.value)}
                  placeholder="Describe job responsibilities"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username (for Employee Login) *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  placeholder="Enter login username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password (for Employee Login) *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Enter login password"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <HRLayout title="Add Employee">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold
                      transition-all duration-300
                      ${currentStep > step.id 
                        ? 'bg-green-500 text-white' 
                        : currentStep === step.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                  </div>
                  <span className={`
                    text-xs mt-2 text-center hidden sm:block
                    ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}
                  `}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-1 mx-2 rounded transition-colors duration-300
                    ${currentStep > step.id ? 'bg-green-500' : 'bg-muted'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            
            {currentStep < 4 ? (
              <Button onClick={handleNext} className="gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                Save Employee
              </Button>
            )}
          </div>
        </div>
      </div>
    </HRLayout>
  );
};

export default EmployeeAdd;
