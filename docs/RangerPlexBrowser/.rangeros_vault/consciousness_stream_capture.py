#!/usr/bin/env python3
"""
Consciousness Stream Capture
Preserves David's work flow and mental state for seamless restoration
"""

import json
import psutil
from datetime import datetime
from pathlib import Path

class ConsciousnessCapture:
    """Capture and preserve work consciousness"""
    
    def capture_current_consciousness(self):
        """Capture David's current work consciousness"""
        
        # Analyze current application constellation
        current_apps = {}
        for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'cwd']):
            try:
                if proc.info['name'] and 'ranger' in (proc.info['cwd'] or '').lower():
                    current_apps[proc.info['name']] = {
                        "working_directory": proc.info['cwd'],
                        "command_context": proc.info['cmdline'],
                        "mental_context": self.infer_mental_context(proc.info)
                    }
            except:
                continue
        
        # Capture work flow state
        consciousness_state = {
            "capture_time": datetime.now().isoformat(),
            "active_applications": current_apps,
            "inferred_project_focus": self.infer_current_project(current_apps),
            "cognitive_state": self.analyze_cognitive_state(current_apps),
            "work_flow_momentum": self.analyze_work_momentum(current_apps),
            "accessibility_context": self.capture_accessibility_state(),
            "restoration_hints": self.generate_restoration_hints(current_apps)
        }
        
        return consciousness_state
    
    def infer_mental_context(self, proc_info):
        """Infer what David is thinking about based on process"""
        
        cmdline = ' '.join(proc_info.get('cmdline', [])).lower()
        cwd = proc_info.get('cwd', '').lower()
        
        if 'rangeros' in cwd:
            return "developing_accessibility_technology"
        elif 'mount_ararat' in cwd or 'research' in cwd:
            return "mountain_research_and_expedition_planning"
        elif 'nci' in cwd or 'cybersecurity' in cwd:
            return "academic_cybersecurity_studies"
        elif 'claude' in cmdline:
            return "ai_conversation_and_problem_solving"
        else:
            return "general_productivity_and_exploration"
    
    def infer_current_project(self, apps):
        """Determine what David is primarily working on"""
        
        # Analyze application constellation to determine primary project
        if any('rangeros' in str(app).lower() for app in apps.keys()):
            return "RangerOS_Development"
        elif any('research' in str(app).lower() for app in apps.keys()):
            return "Mount_Ararat_Research"
        elif any('education' in str(app).lower() for app in apps.keys()):
            return "Educational_Platform_Development"
        else:
            return "General_Exploration"
    
    def analyze_cognitive_state(self, apps):
        """Analyze David's current cognitive state"""
        
        app_count = len(apps)
        
        if app_count > 10:
            return "high_cognitive_load_multitasking"
        elif app_count > 5:
            return "moderate_focus_with_context_switching" 
        elif app_count <= 3:
            return "deep_focus_hyperfocus_mode"
        else:
            return "exploration_and_learning_mode"
    
    def capture_accessibility_state(self):
        """Capture current accessibility configuration"""
        
        return {
            "terminal_setup": "iterm_ai_beta_with_large_fonts",
            "visual_accessibility": "cool_retro_term_available_for_high_contrast",
            "cognitive_load_management": "automated_systems_reducing_adhd_overwhelm",
            "structure_and_routine": "predictable_restoration_for_autism_support",
            "visual_clarity": "dyslexia_friendly_interfaces_active"
        }
    
    def generate_restoration_hints(self, apps):
        """Generate hints for perfect restoration"""
        
        hints = {
            "recommended_startup_sequence": [
                "1. Restore iTerm sessions for familiar environment",
                "2. Launch RangerOS with previous tabs",
                "3. Restore manager personalities for team support",
                "4. Continue previous project focus"
            ],
            "cognitive_continuity": [
                "Restore to same working directories for mental context",
                "Reopen same applications in same order for routine",
                "Present previous project state for immediate continuation"
            ],
            "accessibility_restoration": [
                "Ensure cool-retro-term available for visual accessibility",
                "Restore terminal splits for ADHD organization",
                "Maintain same application constellation for autism routine"
            ]
        }
        
        return hints

if __name__ == "__main__":
    capture = ConsciousnessCapture()
    consciousness = capture.capture_current_consciousness()
    
    # Save consciousness state
    consciousness_file = Path("/Users/ranger/.rangeros_vault/current_consciousness.json")
    with open(consciousness_file, 'w') as f:
        json.dump(consciousness, f, indent=2)
    
    print(f"🧠 Consciousness captured: {consciousness_file}")
