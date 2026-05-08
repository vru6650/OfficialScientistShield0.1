// client/src/components/DashSidebar.jsx
import { Sidebar } from 'flowbite-react';
import {
  HiUser,
  HiArrowSmRight,
  HiDocumentText,
  HiOutlineUserGroup,
  HiAnnotation,
  HiChartPie,
  HiPuzzle, // NEW: Import puzzle icon for quizzes
  HiCollection,
  HiUsers,
} from 'react-icons/hi';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signoutSuccess } from '../redux/user/userSlice';
import LogoutConfirmationModal from './LogoutConfirmationModal';
import { apiFetch } from '../utils/apiFetch';

// Define sidebar links in a configuration array
const sidebarLinks = [
  { tab: 'dash', label: 'Dashboard', icon: HiChartPie, adminOnly: true },
  { tab: 'posts', label: 'Posts', icon: HiDocumentText, adminOnly: true },
  { tab: 'users', label: 'Users', icon: HiOutlineUserGroup, adminOnly: true },
  { tab: 'comments', label: 'Comments', icon: HiAnnotation, adminOnly: true },
  { tab: 'tutorials', label: 'Tutorials', icon: HiDocumentText, adminOnly: true },
  { tab: 'quizzes', label: 'Quizzes', icon: HiPuzzle, adminOnly: true }, // NEW: Add Quizzes link
  { tab: 'problems', label: 'Problems', icon: HiPuzzle, adminOnly: true },
  { tab: 'content', label: 'Content', icon: HiCollection, adminOnly: true },
  { tab: 'community', label: 'Community', icon: HiUsers, adminOnly: true },
];

export default function DashSidebar() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user || {});
  const [tab, setTab] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) {
      setTab(tabFromUrl);
    }
  }, [location.search]);

  const handleSignout = async () => {
    setIsSigningOut(true);
    try {
      await apiFetch('/api/v1/user/signout', { method: 'POST' });
      dispatch(signoutSuccess());
    } catch (error) {
      console.log(error.message);
    } finally {
      setIsSigningOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
      <Sidebar aria-label='Dashboard navigation' className='dashboard-sidebar w-full md:w-64'>
        <Sidebar.Items>
          <div className='dashboard-sidebar__header'>
            <span className='dashboard-sidebar__eyebrow'>Workspace</span>
            <span className='dashboard-sidebar__title'>
              {currentUser?.isAdmin ? 'Admin Console' : 'Profile'}
            </span>
          </div>

          <Sidebar.ItemGroup className='dashboard-sidebar__items'>
            {/* Profile link - handled separately due to its dynamic label */}
            <Link to='/dashboard?tab=profile' className='dashboard-sidebar__link'>
              <Sidebar.Item
                  active={tab === 'profile'}
                  icon={HiUser}
                  label={currentUser?.isAdmin ? 'Admin' : 'User'}
                  labelColor='dark'
                  as='div'
              >
                <span className='md:inline'>Profile</span>
              </Sidebar.Item>
            </Link>

            {/* Render links dynamically from the configuration array */}
            {sidebarLinks
                .filter(link => currentUser?.isAdmin || !link.adminOnly)
                .map(link => (
                    <Link to={`/dashboard?tab=${link.tab}`} key={link.tab} className='dashboard-sidebar__link'>
                      <Sidebar.Item
                          active={tab === link.tab || (link.tab === 'dash' && !tab)}
                          icon={link.icon}
                          as='div'
                      >
                        <span className='md:inline'>{link.label}</span>
                      </Sidebar.Item>
                    </Link>
                ))}

            {/* Sign Out button */}
            <div className='dashboard-sidebar__link dashboard-sidebar__link--action'>
              <Sidebar.Item
                  icon={HiArrowSmRight}
                  className='cursor-pointer'
                  onClick={() => setShowLogoutModal(true)}
              >
                <span className='md:inline'>Sign Out</span>
              </Sidebar.Item>
            </div>
          </Sidebar.ItemGroup>
        </Sidebar.Items>
        <LogoutConfirmationModal
            show={showLogoutModal}
            onClose={() => !isSigningOut && setShowLogoutModal(false)}
            onConfirm={handleSignout}
            processing={isSigningOut}
        />
      </Sidebar>
  );
}
