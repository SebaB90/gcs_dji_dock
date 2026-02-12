import struct
import atexit
import logging
import os
from multiprocessing import shared_memory

logger = logging.getLogger(__name__)

SHM_NAME = "my_shm"  # Python SharedMemory adds "/" prefix automatically
SIZE = 4  # 1 int32

# Costanti
VIDEO_SOURCE_WIDE = 1
VIDEO_SOURCE_ZOOM = 2
VIDEO_SOURCE_THERMAL = 3

class VideoService:
    """Controls video source switching via shared memory"""
    
    def __init__(self):
        self.shm = None
        self.current_source = VIDEO_SOURCE_WIDE
        self._initialize_shm()
        
        # Register cleanup on app exit
        atexit.register(self.cleanup)
    
    def _initialize_shm(self):
        """Initialize shared memory"""
        try:
            self.shm = shared_memory.SharedMemory(name=SHM_NAME, create=True, size=SIZE)
            logger.info(f"Shared memory '{SHM_NAME}' created")

            # Set permissions to 666 (rw-rw-rw-) so all users/containers can access it
            try:
                os.chmod(f"/dev/shm/{SHM_NAME}", 0o666)
                logger.info(f"Shared memory permissions set to 666 (rw-rw-rw-)")
            except Exception as e:
                logger.warning(f"Could not set shared memory permissions: {e}")

            self.set_source(VIDEO_SOURCE_WIDE)
        except FileExistsError:
            try:
                self.shm = shared_memory.SharedMemory(name=SHM_NAME, create=False)
                logger.info(f"Attached to existing shared memory '{SHM_NAME}'")
                self.current_source = struct.unpack("i", self.shm.buf[:4])[0]
            except Exception as e:
                logger.error(f"Error attaching to shared memory: {e}")
                self.shm = None
        except Exception as e:
            logger.error(f"Error initializing shared memory: {e}")
            self.shm = None
    
    def set_source(self, source: int) -> bool:
        if self.shm is None:
            return False
        try:
            if source not in [VIDEO_SOURCE_WIDE, VIDEO_SOURCE_ZOOM, VIDEO_SOURCE_THERMAL]:
                return False
            self.shm.buf[:4] = struct.pack("i", source)
            self.current_source = source
            logger.info(f"Video source switched to ID: {source}")
            return True
        except Exception as e:
            logger.error(f"Error setting video source: {e}")
            return False
    
    def get_source(self) -> int:
        if self.shm is None:
            return VIDEO_SOURCE_WIDE
        try:
            return struct.unpack("i", self.shm.buf[:4])[0]
        except Exception:
            return self.current_source
    
    def cleanup(self):
        if self.shm is not None:
            try:
                self.shm.close()
                self.shm.unlink()
                logger.info("Shared memory cleaned up")
            except Exception:
                pass
            self.shm = None

# Singleton Pattern
video_service_instance = None

def get_video_service() -> VideoService:
    global video_service_instance
    if video_service_instance is None:
        video_service_instance = VideoService()
    return video_service_instance