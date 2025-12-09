"""
Video Source Controller using Shared Memory
Manages video source switching between Wide, Zoom, and Thermal cameras
"""

from multiprocessing import shared_memory
import struct
import atexit
import logging

logger = logging.getLogger(__name__)

SHM_NAME = "my_shm"
SIZE = 4  # 1 int32

# Video source constants
VIDEO_SOURCE_WIDE = 1
VIDEO_SOURCE_ZOOM = 2
VIDEO_SOURCE_THERMAL = 3

class VideoController:
    """Controls video source switching via shared memory"""
    
    def __init__(self):
        self.shm = None
        self.current_source = VIDEO_SOURCE_WIDE
        self._initialize_shm()
        
        # Register cleanup
        atexit.register(self.cleanup)
    
    def _initialize_shm(self):
        """Initialize shared memory"""
        try:
            # Try to create new shared memory
            self.shm = shared_memory.SharedMemory(name=SHM_NAME, create=True, size=SIZE)
            logger.info(f"Shared memory '{SHM_NAME}' created (SIZE={SIZE} bytes)")
            
            # Initialize with default source (Wide camera)
            self.set_source(VIDEO_SOURCE_WIDE)
            
        except FileExistsError:
            # Shared memory already exists, attach to it
            try:
                self.shm = shared_memory.SharedMemory(name=SHM_NAME, create=False)
                logger.info(f"Attached to existing shared memory '{SHM_NAME}'")
                
                # Read current value
                self.current_source = struct.unpack("i", self.shm.buf[:4])[0]
                logger.info(f"Current video source: {self.current_source}")
                
            except Exception as e:
                logger.error(f"Error attaching to shared memory: {e}")
                self.shm = None
                
        except Exception as e:
            logger.error(f"Error initializing shared memory: {e}")
            self.shm = None
    
    def set_source(self, source: int) -> bool:
        """
        Set video source
        
        Args:
            source: Video source ID (1=Wide, 2=Zoom, 3=Thermal)
            
        Returns:
            bool: True if successful, False otherwise
        """
        if self.shm is None:
            logger.error("Shared memory not initialized")
            return False
        
        try:
            # Validate source
            if source not in [VIDEO_SOURCE_WIDE, VIDEO_SOURCE_ZOOM, VIDEO_SOURCE_THERMAL]:
                logger.error(f"Invalid video source: {source}")
                return False
            
            # Write to shared memory
            self.shm.buf[:4] = struct.pack("i", source)
            self.current_source = source
            
            source_name = {
                VIDEO_SOURCE_WIDE: "Wide",
                VIDEO_SOURCE_ZOOM: "Zoom",
                VIDEO_SOURCE_THERMAL: "Thermal"
            }[source]
            
            logger.info(f"Video source switched to: {source_name} ({source})")
            return True
            
        except Exception as e:
            logger.error(f"Error setting video source: {e}")
            return False
    
    def get_source(self) -> int:
        """
        Get current video source
        
        Returns:
            int: Current video source ID
        """
        if self.shm is None:
            return VIDEO_SOURCE_WIDE
        
        try:
            # Read from shared memory
            value = struct.unpack("i", self.shm.buf[:4])[0]
            self.current_source = value
            return value
        except Exception as e:
            logger.error(f"Error reading video source: {e}")
            return self.current_source
    
    def cleanup(self):
        """Clean up shared memory"""
        if self.shm is not None:
            try:
                self.shm.close()
                logger.info("Shared memory closed")
            except FileNotFoundError:
                pass
            except Exception as e:
                logger.error(f"Error closing shared memory: {e}")
            
            try:
                self.shm.unlink()
                logger.info("Shared memory unlinked")
            except FileNotFoundError:
                pass
            except Exception as e:
                logger.error(f"Error unlinking shared memory: {e}")
            
            self.shm = None


# Global instance
video_controller = None

def get_video_controller() -> VideoController:
    """Get or create video controller instance"""
    global video_controller
    if video_controller is None:
        video_controller = VideoController()
    return video_controller
